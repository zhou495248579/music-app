import * as types from '../actionTypes'

export default function (state = {}, action) {
    switch (action.type) {
        case types.SET_SEQUENCE_LIST:
            state.sequenceList = action.songList;
            return state;
        case types.SET_PLAYLIST:
            state.playList = action.songList;
            return state;
        case types.SET_CURRENT_INDEX:
            state.currentIndex = action.index;
            return state;
        case types.SET_FULL_SCREEN:
            state.fullScreen = action.fullScreen;
            return state;
        case types.SET_PLAY_MODE:
            state.mode = action.mode;
            return state;
        case types.SET_PLAYING_STATE:
            state.playing = action.playing;
            return state;
        default: {
            return state;
        }
    }
}
