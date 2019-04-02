import { Dimensions } from 'react-native'
import { DeviceSize } from "./definitions";

// Returns a DeviceSize object with the width and height of the device.
export const getDeviceSize:DeviceSize = () => {
    return {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    }
}