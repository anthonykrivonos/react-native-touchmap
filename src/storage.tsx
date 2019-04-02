import { AsyncStorage } from 'react-native';
import { TouchSession } from './definitions';

// Constructs a Touchmap-specific key in AsyncStorage to not interfere with any others.
const STORAGE_KEY = `storage@react-native-touchmap`;

// Saves the given touch session.
export const saveTouchSession = async (session:TouchSession) => {
    try {
        let allSessions:object|null = await getAllTouchSessions();
        if (allSessions == null) {
            allSessions = {}
        }
        allSessions[session.id] = session;
        let allSessionsString:string = JSON.stringify(allSessions);
        return await AsyncStorage.setItem(STORAGE_KEY, allSessionsString);
    } catch (error) {
        console.error(`Could not save Touch Session ${session.id}`);
    }
}
// Gets all touch sessions.
export const getTouchSessionById = async (id:string) => {
    try {
        return await getAllTouchSessions()[id];
    } catch (error) {
        console.error(`Could not get Touch Session with id ${id}`);
    }
}

// Gets all touch sessions as an id-based object.
export const getAllTouchSessions = async () => {
    try {
        let allSessionsString = await AsyncStorage.getItem(STORAGE_KEY);
        if (allSessionsString == null) {
            allSessionsString = "{}"
        }
        let allSessions:object = JSON.parse(allSessionsString);
        return allSessions;
    } catch (error) {
        console.error(`Could not get all Touch Sessions`);
    }
}

// Gets all touch sessions as an array.
export const getAllTouchSessionsAsList = async () => {
    try {
        let allSessionsObject:object = await getAllTouchSessions();
        let allSessionsList:Array<TouchSession> = [];
        for (let session in allSessionsObject) {
            if (allSessionsObject.hasOwnProperty(session)) {
                allSessionsList.push(allSessionsObject[session]);
            }
        }
        return allSessionsList;
    } catch (error) {
        console.error(`Could not get all Touch Sessions`);
    }
}

// Clears all touch sessions.
export const clearTouchSessions = async () => {
    try {
        let clearedSessionsString:string = "{}";
        return await AsyncStorage.setItem(STORAGE_KEY, clearedSessionsString);
    } catch (error) {
        console.error(`Could not clear all Touch Sessions`);
    }
}