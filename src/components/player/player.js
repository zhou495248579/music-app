import React, {createRef, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Scroll} from "../../base/scroll/scroll";
import {connect} from "react-redux";
import './player.scss';
import {setCurrentIndex, setFullScreen, setPlayingMode, setPlayingState, setPlayList} from "../../redux/actions";
import {ProgressBar} from "../../base/progress-bar/progress-bar";
import {ProgressCircle} from "../../base/progress-circle/progress-circle";
import {playMode} from "../../common/js/config";
import {shuffle} from "../../common/js/utils";
import Lyric from 'lyric-parser'
import {prefixStyle} from "../../common/js/dom";

const LYRIC_LINES = 5;

const transform = prefixStyle('transform')
const transitionDuration = prefixStyle('transitionDuration')

function Player(props) {
    let {
        playList, fullScreen, currentIndex, sequenceList,
        setFullScreen, setPlayingState,
        setCurrentIndex, setPlayingMode,
        playing, mode, setPlayList
    } = props;
    let [songReady, setSongReady] = useState(false); // audio可以播放歌曲了
    let [currentLyric, setCurrentLyric] = useState();
    let [lines, setLines] = useState([]);
    let [currentTime, setCurrentTime] = useState(null);
    const [iconMode, setIconMode] = useState(null);
    const [currentLineNum, setCurrentLineNum] = useState(0);
    const [currentShow, setCurrentShow] = useState('cd');
    const currentSong = playList && playList[currentIndex] || {};
    const audioRef = useRef();
    const lyricRef = useRef();
    const lyricWrapper = useRef();
    const middleLRef = useRef();
    const [touch, setTouch] = useState({});

    const [songPercent, setSongPercent] = useState(0);
    const [lineRefGroup, setLineRefGroup] = useState([]);
    const [playingLyric, setPlayingLyric] = useState('');
    const getLyric = useCallback(() => {
        if (currentSong && currentSong.getLyric) {
            if (currentLyric) {
                currentLyric.stop();
            }
            currentSong.getLyric().then((lyric) => {
                let lineRefGroup = null;

                const newLyric = new Lyric(lyric, ({lineNum, txt}) => {
                    setCurrentLineNum(lineNum)

                    if (lineNum > LYRIC_LINES) {
                        let lineEl = lineRefGroup[lineNum - LYRIC_LINES].current
                        if (lyricRef.current) {
                            lyricRef.current.scrollToElement(lineEl, 0);
                        }
                    } else {
                        if (lyricRef.current) {
                            lyricRef.current.scrollToElement(0, 0, 1000);
                        }
                    }
                    setPlayingLyric(txt);
                });
                setCurrentLyric(newLyric);
                lineRefGroup = newLyric.lines.map(() => {
                    return createRef()
                })
                setLines(newLyric.lines);
                setLineRefGroup(lineRefGroup)

                if (playing) {
                    newLyric.play()
                }
            }).catch(() => {
                setCurrentLyric(null);
                setPlayingLyric('');
                setCurrentLineNum(0);
            })
        }

    }, [currentSong, currentLyric])
    const playSongIfPause = useCallback(() => {
        if (!playing) {
            togglePlaying();

        }

        if (currentLyric) {
            currentLyric.togglePlay();
        }
    }, [currentLyric])
    const touchStartHandle = useCallback((e) => {
        touch.initiated = true;
        touch.moved = false
        touch.startX = e.touches[0].pageX;
        touch.startY = e.touches[0].pageY;
        e.stopPropagation();
        e.preventDefault();
    }, [touch]);

    const touchMoveHandle = useCallback((e) => {
        if (!touch.initiated) {
            return;
        }
        const eventTouch = e.touches[0]
        const deltaX = eventTouch.pageX - touch.startX
        const deltaY = eventTouch.pageY - touch.startY
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            return
        }
        if (!touch.moved) {
            touch.moved = true;
        }
        const left = currentShow === 'cd' ? 0 : -window.innerWidth
        const offsetWidth = Math.min(0, Math.max(-window.innerWidth, left + deltaX))
        touch.percent = Math.abs(offsetWidth / window.innerWidth)
        lyricWrapper.current.style[transform] = `translate3d(${offsetWidth}px,0,0)`
        lyricWrapper.current.style[transitionDuration] = 0
        middleLRef.current.style.opacity = 1 - touch.percent;
        middleLRef.current.style[transitionDuration] = 0
        e.stopPropagation();
        e.preventDefault();
    }, [touch])

    const touchEndHandle = useCallback((e) => {
        if (!touch.moved) {
            return;
        }

        let offsetWidth
        let opacity
        if (currentShow === 'cd') {
            if (touch.percent > 0.1) {
                offsetWidth = -window.innerWidth
                opacity = 0
                setCurrentShow('lyric')
            } else {
                offsetWidth = 0
                opacity = 1
                setCurrentShow('cd')

            }
        } else {
            if (touch.percent < 0.9) {
                offsetWidth = 0
                setCurrentShow('cd')
                opacity = 1
            } else {
                offsetWidth = -window.innerWidth
                opacity = 0
            }
        }
        const time = 300
        lyricWrapper.current.style[transform] = `translate3d(${offsetWidth}px,0,0)`
        lyricWrapper.current.style[transitionDuration] = `${time}ms`
        middleLRef.current.style.opacity = opacity
        middleLRef.current.style[transitionDuration] = `${time}ms`
        touch.initiated = false;
        e.stopPropagation();
        e.preventDefault();
    }, [touch])


    useEffect(() => {
        if (!mode) {
            mode = playMode.sequence;
        }
        const iconMode = mode === playMode.sequence ? 'icon-sequence'
            : mode === playMode.loop ? 'icon-loop' : 'icon-random';
        setIconMode(iconMode);
    }, [mode])
    useEffect(() => {
        if (currentSong && audioRef.current && playing) {
            audioRef.current.play()
            if (currentLyric) {
                console.log('stop', currentLyric)
                currentLyric.stop();
            }
            getLyric();
        }
    }, [currentSong]);
    useEffect(() => {
        if (audioRef.current) {
            if (playing) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }
    }, [playing])
    useEffect(() => {
        setSongPercent(currentTime / currentSong.duration);
    }, [currentTime]);

    function back() {
        setFullScreen(false);
    }

    function open() {
        setFullScreen(true);
    }


    function next() {
        if (!songReady) {
            return;
        }
        if (playList.length === 1) {
            loop();
        } else {
            if (currentIndex === playList.length - 1) {
                setCurrentIndex(0)
            } else {
                setCurrentIndex(currentIndex + 1);
            }
            playSongIfPause();
            waitSongLoad();
        }

    }

    function waitSongLoad() {
        setSongReady(false);
    }

    function prev() {
        if (!songReady) {
            return;
        }
        if (playList.length === 1) {
            loop();
        } else {
            if (currentIndex === 0) {
                setCurrentIndex(playList.length - 1);
            } else {
                setCurrentIndex(currentIndex - 1);
            }
            playSongIfPause()
            waitSongLoad();
        }

    }

    function togglePlaying(e) {
        setPlayingState(!playing);
        if (currentLyric) {
            currentLyric.togglePlay();
        }
        if (e) {
            e.stopPropagation();
        }
    }

    function canPlayHandle() {
        setSongReady(true);
    }

    function audioErrorHandle() {
        songReady = true;
    }

    function timeUpdateHandle(e) {
        setCurrentTime(e.target.currentTime);
    }

    function format(interval) {
        interval = interval | 0
        const minute = interval / 60 | 0
        const second = _pad(interval % 60)
        return `${minute}:${second}`
    }

    function _pad(num, n = 2) {
        let len = num.toString().length
        while (len < n) {
            num = '0' + num
            len++
        }
        return num
    }

    function progressBarChangHandle(percent) {
        const time = currentSong.duration * percent
        setCurrentTime(time);
        audioRef.current.currentTime = time;
        if (!playing) {
            togglePlaying()
        }
        if (currentLyric) {
            currentLyric.seek(time * 1000);
        }
    }

    function resetCurrentIndex(list) {
        let index = list.findIndex((item) => {
            return item.id === currentSong.id
        })
        setCurrentIndex(index)
    }

    function end() {
        if (mode === playMode.loop) {
            loop()
        } else {
            next()
        }
    }

    function loop() {
        audioRef.current.currentTime = 0
        audioRef.current.play()
        if (currentLyric) {
            currentLyric.seek();
        }
    }

    function changeMode() {
        if (!mode) {
            mode = playMode.sequence;
        }
        const songPlayMode = (mode + 1) % 3
        setPlayingMode(songPlayMode);
        let list = null;
        if (songPlayMode === playMode.random) {
            list = shuffle(sequenceList);
        } else {
            list = sequenceList;
        }
        resetCurrentIndex(list)
        setPlayList(list);
    }


    if (playList && playList.length > 0) {
        return <div className="player">
            {fullScreen ? <div className="normal-player">
                    <div className="background">
                        <img width="100%" height="100%" src={currentSong.image} alt=""/>
                    </div>
                    <div className="top">
                        <div className="back">
                            <i className='icon-back' onClick={back}/>
                        </div>
                        <h1 className="title">
                            {currentSong.name}
                        </h1>
                        <h2 className="subtitle">
                            {currentSong.singer}
                        </h2>
                    </div>
                    <div className="middle" onTouchStart={touchStartHandle} onTouchMove={touchMoveHandle}
                         onTouchEnd={touchEndHandle}>
                        <div className="middle-l" ref={middleLRef}>
                            <div className="cd-wrapper">
                                <div className={`cd ${playing ? 'play' : 'play pause'}`}>
                                    <img className="image" src={currentSong.image}/>
                                </div>
                            </div>
                            <div className="playing-lyric-wrapper">
                                <div className="playing-lyric">{playingLyric}</div>
                            </div>
                        </div>
                        <div className="middle-r" ref={lyricWrapper}>
                            <Scroll ref={lyricRef} data={lines}>
                                <div className='lyric-scroll-wrapper'>
                                    <div className="lyric-wrapper">
                                        {lines ? lines.map((line, index) => {
                                            return (<p
                                                ref={lineRefGroup[index]}
                                                className={`text${currentLineNum === index ? ' current' : ''}`}>
                                                {line.txt}
                                            </p>)
                                        }) : 'sdf'}
                                    </div>
                                </div>

                            </Scroll>
                        </div>
                    </div>
                    <div className="bottom">
                        <div className="dot-wrapper">
                            <span className={"dot" + `${currentShow === "cd" ? " active" : ""}`}></span>
                            <span className={"dot" + `${currentShow === "lyric" ? " active" : ""}`}></span>
                        </div>
                        <div className="progress-wrapper">
                            <span className="time time-l">
                                {format(currentTime)}
                            </span>
                            <div className="progress-bar-wrapper">
                                <ProgressBar percent={songPercent} progressBarChang={progressBarChangHandle}/>
                            </div>
                            <span className="time time-r">
                                {format(
                                    currentSong && currentSong.duration
                                )}
                            </span>
                        </div>
                        <div className="operators">
                            <div className="icon i-left">
                                <i className={iconMode} onClick={changeMode}></i>
                            </div>

                            <div className={"icon i-left " + `${songReady ? '' : 'disable'}`}>
                                <i className='icon-prev' onClick={prev}></i>
                            </div>
                            <div className={"icon i-center " + `${songReady ? '' : 'disable'}`}>
                                <i onClick={togglePlaying} className={playing ? 'icon-pause' : 'icon-play'}></i>
                            </div>
                            <div className={"icon i-right " + `${songReady ? '' : 'disable'}`}>
                                <i className='icon-next ' onClick={next}></i>
                            </div>
                            <div className="icon i-right">
                                <i className="icon icon-not-favorite"></i>
                            </div>
                        </div>
                    </div>
                </div>
                : <div className="mini-player" onClick={open}>
                    <div className="icon">
                        <img className={`${playing ? 'play' : 'play pause'}`} src={currentSong.image} width="40"
                             height="40"/>
                    </div>
                    <div className="text">
                        <h2 className="name">
                            {currentSong.name}
                        </h2>
                        <p className="desc">
                            {currentSong.singer}
                        </p>
                    </div>
                    <div className="control">
                        <ProgressCircle percent={songPercent} radius={32}>
                            <i onClick={togglePlaying}
                               className={"icon-mini " + `${playing ? 'icon-pause-mini' : 'icon-play-mini'}`}></i>

                        </ProgressCircle>
                    </div>
                    <div className="control">
                        <i className="icon-playlist"></i>
                    </div>
                </div>
            }
            <audio ref={audioRef} src={currentSong.url} onTimeUpdate={timeUpdateHandle} onError={audioErrorHandle}
                   onEnded={end}
                   onCanPlay={canPlayHandle}/>
        </div>
    } else {
        return <></>
    }
}

const mapStateToProps = state => {
    return {
        ...state.playSong
    };
};
export default connect(
    mapStateToProps,
    {
        setFullScreen,
        setPlayingState,
        setCurrentIndex,
        setPlayingMode,
        setPlayList
    }
)(Player)

