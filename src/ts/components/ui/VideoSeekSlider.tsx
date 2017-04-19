import * as React from 'react';

interface Time {
    hh: string,
    mm: string,
    ss: string
}

export interface Props {
    max: number,
    currentTime: number,
    progress?: number,
    onChange: (time: number, offsetTime: number) => void,
    hideHoverTime?: boolean,
    offset?: number,
}

export interface State {
    ready: boolean,
    trackWidth: number,
    seekHoverPosition: number,
    seeking: boolean,
    mobileSeeking: boolean,
}

export class VideoSeekSlider extends React.Component<Props, State> {
    state: State = {
        ready: false,
        trackWidth: 0,
        seekHoverPosition: 0,
        seeking: false,
        mobileSeeking: false
    };

    static defaultProps: Props = {
        max: 100,
        currentTime: 0,
        progress: 0,
        hideHoverTime: false,
        offset: 0,
    } as Props;

    private track: HTMLDivElement;
    private hoverTime: HTMLDivElement;

    componentDidMount() {
        this.setTrackWidthState();
        window.addEventListener('resize', this.setTrackWidthState);
        window.addEventListener('mousemove', this.handleSeeking);
        window.addEventListener('mouseup', this.setSeeking.bind(this, false));
        window.addEventListener('touchmove', this.handleTouchSeeking);
        window.addEventListener('touchend', this.setMobileSeeking.bind(this, false));
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.setTrackWidthState);
        window.removeEventListener('mousemove', this.handleSeeking);
        window.removeEventListener('mouseup', this.setSeeking.bind(this, false));
        window.removeEventListener('touchmove', this.handleTouchSeeking);
        window.removeEventListener('touchend', this.setMobileSeeking.bind(this, false));
    }

    private handleTouchSeeking = (event): void => {
        let pageX: number = 0;

        for (let i = 0; i < event.changedTouches.length; i++) {
            pageX = event.changedTouches[i].pageX;
        }

        pageX = pageX < 0 ? 0 : pageX;

        if (this.state.mobileSeeking) {
            this.changeCurrentTimePosition(pageX);
        }
    };

    private handleSeeking = (event): void => {
        if (this.state.seeking) {
            this.changeCurrentTimePosition(event.pageX);
        }
    };

    private changeCurrentTimePosition(pageX: number): void {
        let position: number = pageX - this.track.getBoundingClientRect().left;

        position = position < 0 ? 0 : position;
        position = position > this.state.trackWidth ? this.state.trackWidth : position;
        this.setState({
            seekHoverPosition: position
        } as State);

        let percent: number = position * 100 / this.state.trackWidth;
        let time: number = +(percent * (this.props.max / 100)).toFixed(0);
        this.props.onChange(time, (time + this.props.offset));
    }

    private setTrackWidthState = (): void => {
        if (this.track) {
            this.setState({
                trackWidth: this.track.offsetWidth
            } as State);
        }
    };

    private handleTrackHover = (clear: boolean, e): void => {
        let position: number = e.pageX - this.track.getBoundingClientRect().left;

        if (clear) {
            position = 0;
        }

        this.setState({
            seekHoverPosition: position
        } as State);
    };

    private getPositionStyle(time: number): Object {
        let position: number = time * 100 / this.props.max;

        return {
            transform: 'scaleX(' + position / 100 + ')'
        };
    }

    private getThumbHandlerPosition(): Object {
        let position: number = this.state.trackWidth / (this.props.max / this.props.currentTime);

        return {
            transform: 'translateX(' + position + 'px)'
        };
    }

    private getSeekHoverPosition(): Object {
        let position: number = this.state.seekHoverPosition * 100 / this.state.trackWidth;

        return {
            transform: 'scaleX(' + position / 100 + ')'
        }
    }

    private getHoverTimePosition(): Object {
        let position: number = 0;

        if (this.hoverTime) {
            position = this.state.seekHoverPosition - this.hoverTime.offsetWidth / 2;
        }

        return {
            transform: 'translateX(' + position + 'px)'
        }
    }

    private secondsToTime(seconds: number): Time {
        seconds = Math.round(seconds + this.props.offset);

        let hours: number = Math.floor(seconds / 3600);
        let divirsForMinutes: number = seconds % 3600;
        let minutes: number = Math.floor(divirsForMinutes / 60);
        let sec: number = Math.ceil(divirsForMinutes % 60);

        return {
            hh: hours.toString(),
            mm: minutes < 10 ? "0" + minutes : minutes.toString(),
            ss: sec < 10 ? "0" + sec : sec.toString()
        }
    }

    private getHoverTime(): string {
        let percent: number = this.state.seekHoverPosition * 100 / this.state.trackWidth;
        let time: number = +(percent * (this.props.max / 100)).toFixed(0);

        if ((this.props.max + this.props.offset) < 60) {
            return '00:00:' + (time + this.props.offset);
        } else if ((this.props.max + this.props.offset) < 3600) {
            let times: Time = this.secondsToTime(time);

            return '00:' + times.mm + ':' + times.ss;
        } else {
            let times: Time = this.secondsToTime(time);

            return times.hh + ':' + times.mm + ':' + times.ss;
        }
    }

    private setSeeking = (state: boolean, event): void => {
        this.handleSeeking(event);

        this.setState({
            seeking: state,
            seekHoverPosition: !state ? 0 : this.state.seekHoverPosition
        } as State)
    };

    private setMobileSeeking = (state: boolean): void => {
        this.setState({
            mobileSeeking: state,
            seekHoverPosition: !state ? 0 : this.state.seekHoverPosition
        } as State)
    };

    private isThumbActive(): boolean {
        if (this.state.seekHoverPosition > 0 || this.state.seeking) {
            return true;
        }

        return false;
    }

    private drawHoverTime(): JSX.Element {
        if (!this.props.hideHoverTime) {
            return (
                <div
                    className={this.isThumbActive() ? "hover-time active" : "hover-time"}
                    style={this.getHoverTimePosition()}
                    ref={ref => this.hoverTime = ref}
                >
                    {this.getHoverTime()}
                </div>
            )
        }
    }

    public render() {
        return (
            <div
                className="ui-video-seek-slider"
            >
                <div
                    className={this.isThumbActive()?"track active":"track"}
                    ref={ref => this.track = ref}
                    onMouseMove={this.handleTrackHover.bind(this,false)}
                    onMouseLeave={this.handleTrackHover.bind(this, true)}
                    onMouseDown={this.setSeeking.bind(this,true)}
                    onTouchStart={this.setMobileSeeking.bind(this,true)}
                >
                    <div className="main">
                        <div className="buffered" style={this.getPositionStyle(this.props.progress)}></div>
                        <div className="seek-hover" style={this.getSeekHoverPosition()}></div>
                        <div className="connect" style={this.getPositionStyle(this.props.currentTime)}></div>
                    </div>
                </div>

                {this.drawHoverTime()}

                <div className={this.isThumbActive() ? "thumb active" : "thumb"} style={this.getThumbHandlerPosition()}>
                    <div className="handler"/>
                </div>
            </div>
        );
    }
}