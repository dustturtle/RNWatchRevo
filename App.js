/**
 * Day 1
 * A stop watch
 */
"use strict";

import { observable, action, computed, reaction } from "mobx";
import { observer } from "mobx-react/native";

import React, { Component } from "react";
import {
  Platform,
  ListView,
  FlatList,
  StyleSheet,
  StatusBar,
  Text,
  TouchableHighlight,
  View
} from "react-native";
import Util from "./utils";

// 使用无状态组件优化代码结构(所谓无状态，组件里面没有state)
const WatchFace = observer(props => (
  <View style={styles.watchFaceContainer}>
    <Text style={styles.sectionTime}>{props.sectionTime}</Text>
    <Text style={styles.totalTime}>{props.totalTime}</Text>
  </View>
));

@observer
class WatchControl extends Component {
  @observable watchOn = false;

  render() {
    return (
      <View style={styles.watchControlContainer}>
        <View style={{ flex: 1, alignItems: "flex-start" }}>
          <TouchableHighlight
            style={styles.btnStop}
            underlayColor={this.watchOn ? "#111" : "#eee"}
            onPress={() => {
              this.watchOn ? this.props.addRecord() : this.props.clearRecord();
            }}
          >
            <Text style={styles.btnStopText}>
              {this.watchOn ? "计次" : "复位"}
            </Text>
          </TouchableHighlight>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <TouchableHighlight
            style={styles.btnStart}
            underlayColor="#eee"
            onPress={() => {
              this.watchOn ? this.props.stopWatch() : this.props.startWatch();
              this.watchOn = !this.watchOn;
            }}
          >
            <Text
              style={[
                styles.btnStartText,
                { color: this.watchOn ? "#ff0044" : "#60B644" }
              ]}
            >
              {this.watchOn ? "停止" : "启动"}
            </Text>
          </TouchableHighlight>
        </View>
      </View>
    );
  }
}

// simplest showcase.
const WatchRecord = observer(props => {
  var datasource = props.record.slice();
  return (
    <FlatList
      style={styles.recordList}
      data={datasource}
      keyExtractor={(item, index) => index}
      renderItem={({ item }) => (
        <View style={styles.recordItem}>
          <Text style={styles.recordItemTitle}>{item.title}</Text>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.recordItemTime}>{item.time}</Text>
          </View>
        </View>
      )}
    />
  );
});

var msToTimeStr = function(time) {
  var minute = Math.floor(time / (60 * 1000));
  var second = Math.floor((time - 6000 * minute) / 1000);
  //var milSecond = Math.floor((time % 1000) / 10);
  var milSecond = time % 1000;
  return (
    (minute < 10 ? "0" + minute : minute) +
    ":" +
    (second < 10 ? "0" + second : second) +
    "." +
    (milSecond < 10
      ? "00" + milSecond
      : milSecond < 100 ? "0" + milSecond : milSecond)
  );
};

class WatchStore {
  @observable isRunning = false;
  @observable latestTotalMss = 0;
  @observable totalMss = 0;
  @observable records = [];

  totalSaved = 0;

  latestStart = null;
  interval = null;
  initialTime = null;
  lastRecordTime = null;

  @action
  start() {
    var tempTime = new Date().getTime();

    if (this.initialTime != null) this.initialTime = tempTime;

    this.latestStart = tempTime;
    this.totalSaved = this.totalMss;
    var totalLatestSaved = this.latestTotalMss;

    this.isRunning = true;
    this.interval = setInterval(() => {
      var current = new Date().getTime();
      this.totalMss = this.totalSaved + current - this.latestStart;

      if (this.lastRecordTime == null) {
        this.latestTotalMss = this.totalMss;
      } else {
        if (this.lastRecordTime >= this.latestStart) {
          this.latestTotalMss = current - this.lastRecordTime;
        } else {
          this.latestTotalMss = totalLatestSaved + current - this.latestStart;
        }
      }
    }, 10);
  }

  @action
  stop() {
    this.isRunning = false;
    clearInterval(this.interval);
  }

  @action
  reset() {
    this.initialTime = null;
    this.lastRecordTime = null;
    this.latestTotalMss = 0;
    this.totalMss = 0;

    this.records = [];
  }

  @action
  record() {
    var current = new Date().getTime();
    this.lastRecordTime = current;
    this.latestTotalMss = 0;

    this.totalMss = this.totalSaved + current - this.latestStart;

    var len = this.records.length;
    var total = 0;
    for (var index = 0; index < len; index++) {
      total += this.records[index];
    }

    var recordTime = this.totalMss - total;
    this.records.unshift(recordTime);
  }

  @computed
  get totalTimeStr() {
    var str = msToTimeStr(this.totalMss);

    return str;
  }

  @computed
  get latestTotalTimeStr() {
    return msToTimeStr(this.latestTotalMss);
  }

  @computed
  get shownRecords() {
    return this.records.map((recordTime, index) => ({
      title: "计次" + (index + 1),
      time: msToTimeStr(recordTime)
    }));
  }
}

@observer
export default class App extends Component {
  watch = new WatchStore();
  componentWillUnmount() {
    this.watch.stop();
    this.watch.reset();
  }

  render() {
    return (
      <View style={styles.watchContainer}>
        <WatchFace
          totalTime={this.watch.totalTimeStr}
          sectionTime={this.watch.latestTotalTimeStr}
        />
        <WatchControl
          addRecord={() => this.watch.record()}
          clearRecord={() => this.watch.reset()}
          startWatch={() => this.watch.start()}
          stopWatch={() => this.watch.stop()}
        />
        <WatchRecord record={this.watch.shownRecords} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  watchContainer: {
    alignItems: "center",
    backgroundColor: "#f3f3f3",
    marginTop: 60
  },
  watchFaceContainer: {
    width: Util.size.width,
    paddingTop: 50,
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    height: 170
  },
  sectionTime: {
    fontSize: 20,
    fontWeight: "100",
    paddingRight: 30,
    color: "#555",
    position: "absolute",
    left: Util.size.width - 140,
    top: 30
  },
  totalTime: {
    fontSize: Util.size.width === 375 ? 70 : 60,
    fontWeight: "100",
    color: "#222",
    paddingLeft: 0
  },
  watchControlContainer: {
    width: Util.size.width,
    height: 100,
    flexDirection: "row",
    backgroundColor: "#f3f3f3",
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 0
  },
  btnStart: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderColor: "#ff0000",
    borderWidth: 3,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  btnStop: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  btnStartText: {
    fontSize: 14,
    backgroundColor: "transparent"
  },
  btnStopText: {
    fontSize: 14,
    backgroundColor: "transparent",
    color: "#555"
  },
  recordList: {
    width: Util.size.width,
    height: Util.size.height - 300 - 30,
    paddingLeft: 15
  },
  recordItem: {
    height: 40,
    borderBottomWidth: Util.pixel,
    borderBottomColor: "#bbb",
    paddingTop: 5,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 5,
    flexDirection: "row",
    alignItems: "center"
  },
  recordItemTitle: {
    backgroundColor: "transparent",
    flex: 1,
    textAlign: "left",
    paddingLeft: 20,
    color: "#777"
  },
  recordItemTime: {
    backgroundColor: "transparent",
    flex: 1,
    textAlign: "right",
    paddingRight: 20,
    color: "#222"
  }
});
