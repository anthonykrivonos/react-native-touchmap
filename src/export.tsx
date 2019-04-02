import React, { SyntheticEvent } from 'react';
import * as t from 'prop-types';
import { View, StyleSheet, WebView } from 'react-native';
import { getDeviceSize } from './utility';
import { DeviceSize, TouchSession, TouchMeta } from './definitions';

// Abstract: Ugly, but does the job: visual interface to display virtual Touch Map.

const heatmap = 'function heatmap(t){if(!(this instanceof heatmap))return new heatmap(t);this._canvas=t="string"==typeof t?document.getElementById(t):t,this._ctx=t.getContext("2d"),this._width=t.width,this._height=t.height,this._max=1,this._data=[]}"undefined"!=typeof module&&(module.exports=heatmap),heatmap.prototype={defaultRadius:25,defaultGradient:{.4:"blue",.6:"cyan",.7:"lime",.8:"yellow",1:"red"},data:function(t){return this._data=t,this},max:function(t){return this._max=t,this},add:function(t){return this._data.push(t),this},clear:function(){return this._data=[],this},radius:function(t,i){i=void 0===i?15:i;var a=this._circle=this._createCanvas(),e=a.getContext("2d"),h=this._r=t+i;return a.width=a.height=2*h,e.shadowOffsetX=e.shadowOffsetY=2*h,e.shadowBlur=i,e.shadowColor="black",e.beginPath(),e.arc(-h,-h,t,0,2*Math.PI,!0),e.closePath(),e.fill(),this},resize:function(){this._width=this._canvas.width,this._height=this._canvas.height},gradient:function(t){var i=this._createCanvas(),a=i.getContext("2d"),e=a.createLinearGradient(0,0,0,256);for(var h in i.width=1,i.height=256,t)e.addColorStop(+h,t[h]);return a.fillStyle=e,a.fillRect(0,0,1,256),this._grad=a.getImageData(0,0,1,256).data,this},draw:function(t){this._circle||this.radius(this.defaultRadius),this._grad||this.gradient(this.defaultGradient);var i=this._ctx;i.clearRect(0,0,this._width,this._height);for(var a,e=0,h=this._data.length;e<h;e++)a=this._data[e],i.globalAlpha=Math.min(Math.max(a[2]/this._max,void 0===t?.05:t),1),i.drawImage(this._circle,a[0]-this._r,a[1]-this._r);var s=i.getImageData(0,0,this._width,this._height);return this._colorize(s.data,this._grad),i.putImageData(s,0,0),this},_colorize:function(t,i){for(var a,e=0,h=t.length;e<h;e+=4)(a=4*t[e+3])&&(t[e]=i[a],t[e+1]=i[a+1],t[e+2]=i[a+2])},_createCanvas:function(){return"undefined"!=typeof document?document.createElement("canvas"):new this._canvas.constructor}}';

// Stylesheet
const s = StyleSheet.create({
    wrapper: {
        width: 0,
        height: 0,
    },
})

export class TouchMapExporter extends React.Component {

    // Weight of each touch in the exported touch map
    WEIGHT:number = 1;
    MAX_WEIGHT:number = 40;

    // Handle message and turn it into export
    _messageHandler = (onExport?:Function, message?:SyntheticEvent) => {
        if (onExport && message) {
            onExport(message.nativeEvent ? message.nativeEvent.data ? message.nativeEvent.data : '' : '');
        }
    }

    // Parse sessions into list of data values
    _parseSessions = (sessions:Array<TouchSession>) => {
        // Compile data from all touches in every session
        let data:Array<object> = [];
        sessions.forEach((session:TouchSession) => {
            session.touches.forEach((touchMeta:TouchMeta) => {
                data.push([
                    touchMeta.coordinates.x,
                    touchMeta.coordinates.y,
                    this.WEIGHT,
                ]);
            });
        });
        return data
    }

    // Returns JavaScript to be injected into the Web View
    _getInjectedJavaScript = (touchMapId:string, data:Array<Array<number>>, max:number) => {
        return `
            'use strict';

            // heatmap Implementation
            ${heatmap}

            // Parse data from external variables (janky, but works)
            const data = JSON.parse('[' + ${JSON.stringify(data.map(d => JSON.stringify(d)))} + ']');

            // Initialize Touch Map from parsed data
            const touchMap = heatmap('${touchMapId}').data(data).max(${max});

            // Draw Touch Map
            touchMap.draw();

            // Create image from touchMap canvas
            const touchMapImage = document.getElementById('${touchMapId}').toDataURL("image/png");

            setTimeout(() => window.postMessage(touchMapImage), 0)
        `
    }

    render() {

        // Store sessions variable
        const { sessions, onExport } = this.props;

        // Return empty string if no sessions are provided
        if (sessions == null) {
            return (<React.Fragment />)
        }

        // Size of the canvas taken from the first session.
        const size:DeviceSize = getDeviceSize();

        const data:Array<TouchSession> = this._parseSessions(sessions);

        const weight:number = this.MAX_WEIGHT * sessions.length

        // NOTE: We need this so the export canvases can be differentiated,
        // or else we'll be drawing on top of the same one, which causes issues.
        const touchMapId = Date.now().toString()

        return (
            <View style={s.wrapper}>
                <WebView
                    useWebKit={true}
                    originWhitelist={['*']}
                    onMessage={(message:SyntheticEvent) => this._messageHandler(onExport, message)}
                    source={{
                        html: `<canvas id="${touchMapId}" style="display:none;" width="${size.width}" height="${size.height}"></canvas>`
                    }}
                    javaScriptEnabled={true}
                    injectedJavaScript={this._getInjectedJavaScript(touchMapId, data, weight)}
                />
            </View>
        )
    }

    static propTypes = {
        /** List of TouchSession objects. */
        sessions: t.arrayOf(t.object),
        /** Function called onExport. */
        onExport: t.func.isRequired,
    }

}