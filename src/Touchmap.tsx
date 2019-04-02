import React, { SyntheticEvent } from 'react';
import * as t from 'prop-types';
import { View, Modal, StyleSheet, Image, AppState, TouchableOpacity, Text } from 'react-native';
import { TouchSession, TouchMeta, } from './definitions';
import { saveTouchSession, getAllTouchSessions, getAllTouchSessionsAsList, clearTouchSessions, getTouchSessionById } from './storage';
import { TouchMapExporter } from './export'
import { getDeviceSize } from './utility';

// Store package.json for versioning.
import jsonPackage from "../package.json";

// Constant styles so we KISS.
const styleConstants = {
    /** Rawring Red */ 
    redColor: '#ff6142',
    /** Bleeping Blue */
    blueColor: '#699cef',
}

// Style sheet for the Touchmap component.
const s = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    debug: {
        borderColor: styleConstants.redColor,
        borderWidth: 4,
    },
    debugContainer: {
        position: 'absolute',
        bottom: 0,
        zIndex: 1,
        flex: 1,
        flexDirection: 'column',
    },
    debugButtons: {
        flex: 1,
        flexDirection: 'row',
    },
    debugText: {
        flex: 1,
        textAlign: 'center',
        color: 'black',
    },
    debugButton: {
        width: '50%',
        alignSelf: 'center',
        padding: 15,
    },
    debugButtonText: {
        textAlign: 'center',
        color: 'white',
    },
    clearButton: {
        backgroundColor: styleConstants.redColor,
    },
    viewButton: {
        backgroundColor: styleConstants.blueColor,
    },
    modalContainer: {
      flex: 1,
      shadowColor: 'gray',
      shadowOpacity: 0.5,
      shadowRadius: 8,
      shadowOffset: { height: 0, width: 0 },
    },
    modalImage: {
      flex: 1,
      backgroundColor: '#f2efef',
    },
})

export default class Touchmap extends React.Component {

    // Current touch session.
    private currentSession!:TouchSession

    // Current touch being handled.
    private currentTouch?:TouchMeta

    // Exported image string
    private exportedImageString?:string

    state = {
        displayExportedTouchmap: false,
        onExport: null,
        exportSessions: [],
    }

    //
    // Component Life Cycle
    //

    componentDidMount() {
        AppState.addEventListener('change', this._onViewExit);
    }

    // Called when the view is exited, such as when the app is in the background or is inactive.
    private _onViewExit = async (state:string) => {

        // Perform the following if the app is exited.
        if (state === 'background' || state === 'inactive') {
            await this._save()
        }

        return true
    }

    //
    // Persistence Functions
    //

    // Saves the current touch session
    private _save = async () => {
        // Update end time of the current session
        this.currentSession.endTime = new Date();
        return saveTouchSession(this.currentSession)
    }

    // Resets the current touch session
    private _reset = () => {
        // Create current session object
        const startTime = new Date();
        const id = `id@${startTime.getTime()}`
        this.currentSession = {
            id,
            startTime,
            endTime: null,
            touches: new Array<TouchMeta>(),
            deviceSize: getDeviceSize(),
        }
    }

    //
    // Reference Functions
    //

    // Clears all touch sessions.
    public clear = async () => {
        this._reset()
        return clearTouchSessions()
    }

    // Gets all touch sessions asynchronously
    public raw = async () => {
        return getAllTouchSessions()
    }

    // Export a group of sessions into a canvas Touch Map image
    public export = async () => {

        // Export every session or just current session?
        const currentSessionOnly = this.props.sessionOnly != null ? this.props.sessionOnly : false

        // Since this function is unconnected to the Exporter component, we must wait
        // until the image string value is retrieved from there, into this component.
        // We'll use an interval and a timeout to check this.
        const PERIODS_TO_CHECK = 40 // Wait 10 seconds in total
        const DURATION_OF_EACH_PERIOD = 250 // Each period being 1/4 of a second

        // Reset this class's exported image string
        this.exportedImageString = null
        
        // Save before exporting.
        await this._save()

        // Define return function
        const onReceieveSessions = async (exportSessions:Array<TouchSession>) => {
            // Create an onExport function that updates the class property exportedImageString.
            const onExport = (imageString:string) => {
                this.exportedImageString = imageString
            }

            // Update the exportSessions and onExport state values.
            this.setState({ exportSessions, onExport });

            // Wait for exportedImageString to be returned.
            return new Promise((resolve:Function, reject:Function) => {
                let wait = setTimeout(() => {
                   return reject('No exported image string found.');
                }, DURATION_OF_EACH_PERIOD * PERIODS_TO_CHECK);
                let check = setInterval(() => {
                    if (this.exportedImageString != null && this.exportedImageString.length > 0) {
                        clearTimeout(wait);
                        clearInterval(check);
                        return resolve(this.exportedImageString);
                    }
                }, DURATION_OF_EACH_PERIOD);
            })
        };

        if (currentSessionOnly) {
            return onReceieveSessions([ this.currentSession ])
        }

        // Asynchronously get all sessions as a list.
        return getAllTouchSessionsAsList().then((exportSessions:Array<TouchSession>) => {
            return onReceieveSessions(exportSessions)
        }).catch((error:string) => {
            return Promise.reject(error);
        })
    }

    //
    // Debug Functions
    //

    // Logs a message if debug mode is active.
    private _debugLog = (...log:Array<string>) => {
        const { debug } = this.props;
        if (debug) {
            let out = `${Date.now()}: `
            log.forEach(text => out += `${text} `);
            out.trim();
            console.log(out);
        }
    }

    // Exports an image when the user taps 'View Touchmap' in debug mode.
    private _debugExport = () => {
        this.export().then((exportedTouchmap:string) => {
            this.setState({ displayExportedTouchmap: true })
        })
    }

    // Closes the debug touchmap image.
    private _debugClose = () => {
        this.setState({ displayExportedTouchmap: false })
    }

    // Clears the current working session of touches.
    private _debugClear = () => {
        this.clear()
    }

    //
    // Touch Updaters
    //

    // Initializes the current touch from a synthetic event.
    private _initializeCurrentTouch = (event:SyntheticEvent) => {
        // Capture nativeEvent from event object
        const nativeEvent:any = event.nativeEvent;

        // Initialize current touch
        this.currentTouch = {
            coordinates: {
                x: nativeEvent.pageX,
                y: nativeEvent.pageY
            },
            startTime: new Date(nativeEvent.timestamp),
            endTime: null,
            duration: 0,
        }
    }

    // Completes the given current touch from a synthetic event and resets it.
    private _completeCurrentTouch = (event:SyntheticEvent) => {

        // Capture nativeEvent from event object
        const nativeEvent:any = event.nativeEvent;

        // Update current touch end time and duration
        this.currentTouch.endTime = new Date(nativeEvent.timestamp);
        this.currentTouch.duration =  this.currentTouch.endTime.getTime() - this.currentTouch.startTime.getTime();

        // Push the current touch and create a new touch
        this.currentSession.touches.push(this.currentTouch!)

        // Nullify current touch
        this._initializeCurrentTouch(event)
    }

    //
    // Touch Life Cycle
    //

    // Called when touches begin.
    private _onTouchStart = (event:SyntheticEvent) => {
        this._debugLog('_onTouchStart')

        console.log(event)

        // Initialize touch
        this._initializeCurrentTouch(event);

        // Return true to allow touches.
        return true
    }

    // Called when a touch's location is moved but is not halted.
    private _onTouchMove = (event:SyntheticEvent) => {
        this._debugLog('_onTouchMove')

        // Minimum distance required to create a new touch event
        const THRESHOLD_DISTANCE = 10

        const distance = Math.sqrt(
            Math.pow(event.nativeEvent.pageX - this.currentTouch.coordinates.x, 2) + 
            Math.pow(event.nativeEvent.pageY - this.currentTouch.coordinates.y, 2))

        if (distance > THRESHOLD_DISTANCE) {
            // Complete the current touch
            this._completeCurrentTouch(event);
        }
    }

    // Called when a touch is canceled either internally by the View
    // or externally by another component or process.
    private _onTouchCancel = (event:SyntheticEvent) => {
        this._debugLog('_onTouchCancel')

        // Cancel current touch
        this.currentTouch = null
    }

    // Called when touches end without a cancellation.
    private _onTouchEnd = (event:SyntheticEvent) => {
        this._debugLog('_onTouchEnd')

        // Complete the current touch
        this._completeCurrentTouch(event);
    }

    //
    // Special Touches
    //

    // Called when an accessiblity double touch is performed.
    private _onDoubleTouchAccessible = (event:SyntheticEvent) => {
        this._debugLog('_onDoubleTouchAccessible')

        this._onTouchStart(event)
        this._onTouchEnd(event)
    }

    // Called when a double-two-finger touch is performed.
    private _onDoubleTwoFingerTouch = (event:SyntheticEvent) => {
        this._debugLog('_onDoubleTwoFingerTouch')

        this._onTouchStart(event)
        this._onTouchEnd(event)
    }

    //
    // Render Methods
    //

    // Reset the current session when the view is layed out
    private _onLayout = () => {
        this._debugLog('_onLayout')
        this._reset()
    }

    // Inject touch event responders to anything that has an onPress or onLongPress.
    // Janky, but this is the only way to do it in the forseeable future and is not particularly slow.
    private _getChildrenWithInjectedTouchEvents = (childrenIn:any = []) => {

        // Initialize a list of children
        let children = []

        // Create the list of children
        if (childrenIn.constructor !== Array) {
            children = [ childrenIn ];
        } else {
            children = childrenIn.slice();
        }

        for (let i = 0; i < children.length; i++) {

            // Skip children that are not objects, as they can't have onPress or onLongPress props
            if (typeof children[i] != 'object') {
                continue;
            }

            // Copy the current child being looped through
            let child = Object.assign({}, children[i]);

            // Assure the child has props and propTypes
            if (child.props || (child.type && child.type.propTypes)) {

                // Create a new props object that we can overwrite
                let props = Object.assign({}, child.props);

                // Add onPress handling for touches
                if ((child.props && child.props.hasOwnProperty('onPress')) || (child.type && child.type.propTypes && child.type.propTypes.hasOwnProperty('onPress'))) {
                    const prevPress = props.onPress;
                    props.onPress = (event:SyntheticEvent) => {
                        this._onTouchStart(event)
                        this._onTouchEnd(event)
                        if (prevPress) {
                            prevPress(event)
                        }
                    }
                }

                // Add onLongPress handling for touches
                if ((child.props && child.props.hasOwnProperty('onLongPress')) || (child.type && child.type.propTypes && child.type.propTypes.hasOwnProperty('onLongPress'))) {
                    const prevLongPress = props.onLongPress;
                    props.onLongPress = (event:SyntheticEvent) => {
                        this._onTouchStart(event)
                        this._onTouchEnd(event)
                        if (prevLongPress) {
                            prevLongPress(event)
                        }
                    }
                }

                // Update the props property of the child
                child.props = props;
            }

            // Recur if more children are found in the current child
            if (child.props.hasOwnProperty('children')) {
                child.props.children = this._getChildrenWithInjectedTouchEvents(child.props.children)
            }

            // Update the child in the array
            children[i] = child;
        }
        // Return the modified children
        return children;
    }

    render() {
        const { children, debug, style, sessionOnly } = this.props;

        // Add debug styles
        let containerStyles = [ s.wrapper, style ]
        if (debug) {
            containerStyles.push(s.debug);
        }

        // Inject touch events into children.
        let injectedChildren = this._getChildrenWithInjectedTouchEvents(children);

        // Text shown above debug buttons in debug mode
        const debugText = `react-native-touchmap: v${jsonPackage.version}`

        return (
            <React.Fragment>
                <View
                    style={containerStyles}
                    onLayout={this._onLayout}
                    onMagicTap={this._onDoubleTwoFingerTouch}
                    onAccessibilityTap={this._onDoubleTouchAccessible}
                    onStartShouldSetResponder={this._onTouchStart}
                    onResponderMove={this._onTouchMove}
                    onResponderReject={this._onTouchCancel}
                    onResponderTerminate={this._onTouchCancel}
                    onResponderRelease={this._onTouchEnd}
                    pointerEvents={'box-none'}
                >
                    {injectedChildren}
                </View>
                { debug &&
                    <View style={s.debugContainer}>
                        <Text style={s.debugText}>{debugText}</Text>
                        <View style={s.debugButtons}>
                            <TouchableOpacity onPress={this._debugExport} activeOpacity={0.8} style={[ s.debugButton, s.viewButton ]}>
                                <Text style={s.debugButtonText}>View Touchmap</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={this._debugClear} activeOpacity={0.8} style={[ s.debugButton, s.clearButton ]}>
                                <Text style={s.debugButtonText}>Clear Touchmap</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                { debug &&
                    <Modal
                        transparent={true}
                        presentationStyle={'overFullScreen'}
                        animationType={"slide"}
                        visible={this.state.displayExportedTouchmap}
                    >
                        <TouchableOpacity activeOpacity={1} onPress={this._debugClose} style={s.modalContainer}>
                            <Image style={s.modalImage} source={{uri: this.exportedImageString}} />
                        </TouchableOpacity>
                    </Modal>
                }
                <TouchMapExporter sessions={this.state.exportSessions} onExport={this.state.onExport} />
            </React.Fragment>
        );
    }

    static propTypes = {
        /** Children/child nodes of the Touchmap component. */
        children: t.oneOfType([ t.arrayOf(t.node), t.node ]).isRequired,
        /** Display debugging features such as red border, version number, and 'View' and 'Clear' options? */
        debug: t.bool,
        /** Style of the Touchmap container. */
        style: t.oneOfType([ t.number, t.object, t.array ]),
        /** Export touches for only the current session? */
        sessionOnly: t.bool,
    }

}