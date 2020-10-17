const ccConfig = {
	//IMG_SRC: "./img1.jpg",
	IMG_SRC: "img/pixel.png",
	CHECK_FREQ: 3000,
	RESPONSE_TIME_FAST: 50,
	RESPONSE_TIME_SLOW: 500,
	RESPONSE_TIMEOUT: 2500,
	COLOR_BG_TIMESTAMP: "#999",
	COLOR_TEXT_TIMESTAMP: "#000",
	COLOR_BG_HUE_FASTEST: 180,
	COLOR_BG_HUE_SLOWEST: 0,
	COLOR_TEXT_REGULAR: "#000",
	COLOR_BG_TIMEOUT: "hsl(270 100% 50%)",
	COLOR_TEXT_TIMEOUT: "#fff",
	TEXT_TIMEOUT: "T.O.",
	COLOR_BG_ERROR: "hsl(330 100% 45%)",
	COLOR_TEXT_ERROR: "#fff",
	TEXT_ERROR: "ERR"
};

class ConnChecker {
	constructor(config) {
		this.config = config;
	}

	go() {
		this.isInProgress = false;
		this.img = new Image();
		this.img.onload = () => {
			this.onLoad();
		};
		this.img.onerror = () => {
			this.onError();
		};
		// this.stats = {
		// 	totalCount: 0,
		// 	oks: 0,
		// 	timeouts: 0,
		// 	errors: 0
		// };
		this.elms = {
			legendFast: document.getElementById("snc-legend-fast"),
			legendColors: document.getElementById("snc-legend-colors"),
			legendSlow: document.getElementById("snc-legend-slow"),
			legendTimeout: document.getElementById("snc-legend-timeout"),
			legendError: document.getElementById("snc-legend-error"),
			legendTimestamp: document.getElementById("snc-legend-timestamp"),
			container: document.getElementById("snc-container")
		};
		this.displayLegend();
		//this.startTime = new Date().getTime();
		this.lastReportedTimeStr = "";
		this.startChecks();
	}

	startChecks() {
		this.checksInterval = setInterval(() => {
			this.checkConn();
		}, this.config.CHECK_FREQ);
		this.isCheckRunning = true;
	}

	stopChecks() {
		if (!this.isCheckRunning) {
			return;
		}
		clearInterval(this.checksInterval);
		this.isCheckRunning = false;
	}

	// diaplayStats() {
	//   const durationMins = Math.trunc(
	//     (new Date().getTime() - this.startTime) / 1000 / 60
	//   );
	//   this.elms.info.textContent = `Frequency: ${
	//     this.config.CHECK_FREQ
	//   }ms, Timeouts: ${(
	//     (this.stats.timeouts / this.stats.totalCount) *
	//     100
	//   ).toFixed(2)}%, Errors: ${(
	//     (this.stats.errors / this.stats.totalCount) *
	//     100
	//   ).toFixed(2)}%`;
	// }

	displayLegend() {
		this.elms.legendFast.textContent = `${this.config.RESPONSE_TIME_FAST}ms`;
		this.elms.legendSlow.textContent = `${this.config.RESPONSE_TIME_SLOW}ms`;
		this.elms.legendColors.style.background = `linear-gradient(to right, hsl(${
		this.config.COLOR_BG_HUE_FASTEST
		} 100% 50%), hsl(${Math.trunc(
		(this.config.COLOR_BG_HUE_FASTEST - this.config.COLOR_BG_HUE_SLOWEST) / 2
		)} 100% 50%), hsl(${this.config.COLOR_BG_HUE_SLOWEST} 100% 50%))`;
		this.addPoint(
		this.elms.legendTimeout,
		this.config.COLOR_BG_TIMEOUT,
		this.config.COLOR_TEXT_TIMEOUT,
		this.config.TEXT_TIMEOUT
		);
		this.addPoint(
		this.elms.legendError,
		this.config.COLOR_BG_ERROR,
		this.config.COLOR_TEXT_ERROR,
		this.config.TEXT_ERROR
		);
		this.addPoint(
		this.elms.legendTimestamp,
		this.config.COLOR_BG_TIMESTAMP,
		this.config.COLOR_TEXT_TIMESTAMP,
		"00:00"
		);
	}

	getCurrentTime() {
		const now = new Date();
		let hh = now.getHours();
		if (hh < 10) {
			hh = "0" + hh;
		}
		let mm = now.getMinutes();
		if (mm < 10) {
			mm = "0" + mm;
		}
		return `${hh}:${mm}`;
	}

	addPoint(containerElm, bgColor, textColor, text) {
		const elm = document.createElement("DIV");
		elm.classList.add("snc-point");
		elm.style["background-color"] = bgColor;
		elm.style["color"] = textColor;
		elm.textContent = text;
		containerElm.appendChild(elm);
	}

	handleTime() {
		const currentTimeStr = this.getCurrentTime();
		if (currentTimeStr === this.lastReportedTimeStr) {
			return;
		}
		this.addPoint(
		this.elms.container,
		this.config.COLOR_BG_TIMESTAMP,
		this.config.COLOR_TEXT_TIMESTAMP,
		currentTimeStr
		);
		this.lastReportedTimeStr = currentTimeStr;
	}

	onCheckDone(bgColor, textColor, text) {
		clearTimeout(this.timeoutTimer);
		this.isInProgress = false;
		// this.stats.totalCount++;
		// this.diaplayStats();
		this.handleTime();
		this.addPoint(this.elms.container, bgColor, textColor, text);
	}

	getCheckTime() {
		return new Date().getTime() - this.curCheckStartTime;
	}

	onLoad() {
		if (!this.isInProgress) {
			return;
		}
		const checkTime = this.getCheckTime();
		// this.stats.oks++;
		let h;
		if (checkTime <= this.config.RESPONSE_TIME_FAST) {
			h = 1;
		} else if (checkTime >= this.config.RESPONSE_TIME_SLOW) {
			h = 0;
		} else {
			h =
			1 -
			(checkTime - this.config.RESPONSE_TIME_FAST) /
			(this.config.RESPONSE_TIME_SLOW - this.config.RESPONSE_TIME_FAST);
		}
		const hue = Math.trunc(
		h *
		(this.config.COLOR_BG_HUE_FASTEST - this.config.COLOR_BG_HUE_SLOWEST) +
		this.config.COLOR_BG_HUE_SLOWEST
		);
		this.onCheckDone(
		`hsl(${hue} 100% 50%)`,
		this.config.COLOR_TEXT_REGULAR,
		checkTime
		);
	}

	onTimeout() {
		if (!this.isInProgress) {
			return;
		}
		// this.stats.timeouts++;
		this.onCheckDone(
		this.config.COLOR_BG_TIMEOUT,
		this.config.COLOR_TEXT_TIMEOUT,
		this.config.TEXT_TIMEOUT
		);
	}

	onError() {
		if (!this.isInProgress) {
			return;
		}
		// this.stats.errors++;
		this.onCheckDone(
		this.config.COLOR_BG_ERROR,
		this.config.COLOR_TEXT_ERROR,
		this.config.TEXT_ERROR
		);
	}

	getImgSrc() {
		return this.config.IMG_SRC + "?cachebreaker=" + new Date().getTime();
	}

	checkConn() {
		if (this.isInProgress) {
			return;
		}
		this.isInProgress = true;
		this.curCheckStartTime = new Date().getTime();
		this.img.src = this.getImgSrc();
		this.timeoutTimer = setTimeout(() => {
			this.onTimeout();
		}, this.config.RESPONSE_TIMEOUT);
	}
}

const connChecker = new ConnChecker(ccConfig);
connChecker.go();
