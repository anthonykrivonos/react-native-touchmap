// Abstract: Object definitions for all interactions in this library.

/** Multiple touch events constituting a session of having the app running. */
export interface TouchSession {
    /** Unique string identifier of the touch session. */
    id: string;
    /** Start time of this session. */
    startTime: Date;
    /** End time of this session. Optional because crashes might not register an end time. */
    endTime?: Date;
    /** An array of touches during this session. */
    touches: Array<TouchMeta>
    /** Size of the device. */
    deviceSize: DeviceSize;
}

/** Single touch event object. */
export interface TouchMeta {
    /** Coordinates of the touch. */
    coordinates: TouchCoordinates;
    /** Start time of this touch. */
    startTime: Date;
    /** End time of this session. Optional because touches may be canceled. */
    endTime?: Date;
    /** Duration of the touch, in milliseconds. */
    duration?: number;
}

/** Simple coordinates interface. */
export interface TouchCoordinates {
    /** x-coordinate of the touch. */
    x: number;
    /** y-coordinate of the touch. */
    y: number;
}

/** Simple device size interface. */
export interface DeviceSize {
    /** Width of the device, in pixels. */
    width: number;
    /** Height of the device, in pixels. */
    height: number;
}