import React from "react";
import { throttle } from "lodash";

import DrawingServer from "./DrawingServer";
import generatePathSegments from "./generate-paths";

import "./App.css";

export default class DrawingApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dragging: false,
      points: [],
      confirmedPoints: [],
      justStarted: false,
      server: new DrawingServer(),
    };

    this.pointsToSend = [];
    this.pointId = 0;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.reset = this.reset.bind(this);
    this.refresh = this.refresh.bind(this);
    this.sendPoints = throttle(this.sendPoints.bind(this), 200, {
      leading: true,
      trailing: true,
    });
  }

  componentDidMount() {
    this.refresh();
  }

  onMouseDown(ev) {
    this.setState({ dragging: true, justStarted: true });
  }

  onMouseUp(ev) {
    this.setState({ dragging: false });
  }

  onMouseMove(ev) {
    if (this.state.dragging) {
      // We will build an array of exactly one or two points to add to our overall line data
      const newPoints = [];

      // If this point is the start of a new segment, create an "end segment" point
      // with null coordinates.
      //
      // This simply acts as a separator between segments so we can keep all
      // points in one flat array.
      if (this.state.justStarted && this.state.points.length > 0) {
        newPoints.push({
          id: this.pointId++,
          x: null,
          y: null,
          isEndOfSegment: true,
        });
      }

      // Append a new point to the array
      const newPoint = {
        id: this.pointId++,
        x: ev.nativeEvent.offsetX,
        y: ev.nativeEvent.offsetY,
        isEndOfSegment: false,
      };

      newPoints.push(newPoint);

      this.setState({
        points: this.state.points.concat(newPoints),
        justStarted: false,
      });

      this.pointsToSend = this.pointsToSend.concat(newPoints);

      this.sendPoints();
    }
  }

  reset() {
    this.setState({ points: [], confirmedPoints: [], justStarted: true });
    this.pointId = 0
    this.state.server.reset();
  }

  refresh() {
    this.state.server
      .getPoints()
      .then((confirmedPoints) => {
        //make sure the points are sorted into the correct order
        confirmedPoints.sort((a, b) => a.id - b.id)
        this.pointId = confirmedPoints.length
        this.setState({ points: confirmedPoints, confirmedPoints });
      })
      .catch((error) => {
        console.warn(error);
      });
  }

  sendPoints() {
	//console.log('sending', this.pointsToSend)
    // And send to the "remote" server
    this.state.server
      .addPoints(this.pointsToSend)
      .then((confirmedPoints) => {
		//console.log('confirmed', confirmedPoints)
		// points may come back from the server out of order because of latency, so we have added an id to each point
		// so we can always sort them into the same order. (Array.sort sorts the array in place)
        this.setState({
          confirmedPoints: this.state.confirmedPoints.concat(confirmedPoints).sort((a, b) => a.id - b.id),
        });
      })
      .catch((error) => {
        console.error(error)
      });

    this.pointsToSend = [];
  }

  render() {
    return (
      <div className="DrawingApp">
        <svg
          width="100%"
          height="100%"
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onMouseMove={this.onMouseMove}
        >
          {generatePathSegments(this.state.points, "sent")}
          {generatePathSegments(this.state.confirmedPoints, "confirmed")}
        </svg>
        <div className="reset">
          <button onClick={this.reset}>Reset</button>
        </div>
      </div>
    );
  }
}
