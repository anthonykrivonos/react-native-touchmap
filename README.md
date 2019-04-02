# ☝️ react-native-touchmap

Simple, free, and lightweight heatmap component to track touches in your React Native app!

<img style="width: 40%; margin-right:10%" alt="exported" src="https://media.giphy.com/media/3WvhUQxywKu5vFGvkG/giphy.gif" />
<img style="width: 40%; border: solid 2px red;" alt="exported" src="https://i.imgur.com/dN87VFo.png" />

## Getting Started

1. Run `npm install react-native-touchmap` or `yarn add react-native-touchmap` to add this dependency to your project.
2. Wrap your app's **root component** in the `<Touchmap>` tag.
3. Export the output however you want!

## The `<Touchmap>` Component

Below is a **complete** implementation.
```
/** Reference variable within your component: */
touchmap:Touchmap = null

/** Inside render(): */
<Touchmap
    style={s.yourStyle}
    debug={true}
    sessionOnly={true}
    ref={r => this.touchmap = r}
>
    ...
</Touchmap>
```
<span style="background:teal;font-size: 18pt;">
<span style="color:red;">T</span><span style="color:orange;">h</span><span style="color:yellow;">a</span><span style="color:white;">t</span><span style="color:blue;">'</span><span style="color:indigo;">s</span><span style="color:red;"> </span><span style="color:violet;">i</span><span style="color:red;">t</span><span style="color:orange;">!</span></span>

### Props

|  | Values | Description |
|:-----------:|:---------------:|:----------------------------------------------------------------------------------------------:|
| `style` | {}, [], # | Style of the Touchmap container. |
| `debug` | true/false | Display debugging features such as red border, version number, and 'View' and 'Clear' options? |
| `sessionOnly` | true/false | Export touches for only the current session? |
| `ref` | Touchmap object | Reference available functions `raw`, `clear`, and `export` from a property variable. |
| `children` | nodes | Child nodes of the Touchmap. Usually the root component of the app. |

### Ref Functions

`clear:()=>void`
Clears all touches from every session.

`raw:()=>Array<TouchSession>`
Returns a list of `TouchSession` objects, if you want to parse touches yourself.

`export()=>string`
Returns an encoded string of the image created. This may be used as a `uri` in an image component or can be handled as an image.

### Type Definitions

```
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
```

## Contributing

If you'd like to improve and/or expand the content of this library, feel free to submit pull requests. If you experience any issues with this code, please let me know promptly.

## Authors

* **Anthony Krivonos** - *Developer* - [Portfolio](https://anthonykrivonos.com)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Vicki Shao for all the support and flames! 🔥