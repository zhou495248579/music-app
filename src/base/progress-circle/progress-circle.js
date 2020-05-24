import React, {useEffect, useState} from "react";
import './progress-circle.scss';

export function ProgressCircle(props) {
    const {radius = 100, percent, children} = props;
    const [dashOffset, setDashOffset] = useState(0);
    const dashArray = Math.PI * 100;
    useEffect(() => {
        setDashOffset((1 - percent) * dashArray);
    }, [percent]);
    return (
        <div className="progress-circle">
            <svg width={radius} height={radius} viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <circle className="progress-background" r="50" cx="50" cy="50" fill="transparent"/>
                <circle className="progress-bar" r="50" cx="50" cy="50" fill="transparent"
                        stroke-dasharray={dashArray}
                        stroke-dashoffset={dashOffset}/>
            </svg>
            {children}
        </div>
    )
}
