import * as types from '../actionTypes'

export default function (state = {}, action) {
    console.log(action)
    switch (action.type) {
        case types.SET_SEQUENCE_LIST:
            return {
                ...state,
                sequenceList: action.songList
            };
        case types.SET_PLAYLIST:
            return {
                ...state,
                playList: action.songList
            };
        case types.SET_CURRENT_INDEX:
            return {
                ...state,
                currentIndex: action.index
            };
        case types.SET_FULL_SCREEN:
            return {
                ...state,
                fullScreen: action.fullScreen
            };
        case types.SET_PLAY_MODE:
            return {
                ...state,
                mode: action.mode
            };
        case types.SET_PLAYING_STATE:
            return {
                ...state,
                playing: action.isPlaying
            };
        case types.SET_DISC:
            console.log(action)
            return {
                ...state,
                disc: action.disc
            }
        default: {
            return state;
        }
    }
}

