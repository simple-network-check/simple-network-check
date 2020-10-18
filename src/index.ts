interface Config {
	IMG_SRC: string;
	CHECK_FREQ: number;
	RESPONSE_TIME_FAST: number;
	RESPONSE_TIME_SLOW: number;
	RESPONSE_TIMEOUT: number;
	COLOR_BG_TIMESTAMP: string;
	COLOR_TEXT_TIMESTAMP: string;
	COLOR_BG_HUE_FASTEST: number;
	COLOR_BG_HUE_SLOWEST: number;
	COLOR_TEXT_REGULAR: string;
	COLOR_BG_TIMEOUT: string;
	COLOR_TEXT_TIMEOUT: string;
	TEXT_TIMEOUT: string;
	COLOR_BG_ERROR: string;
	COLOR_TEXT_ERROR: string;
	TEXT_ERROR: string;
}

class ConnChecker {
	private checksInterval: number = 0;
	private timeoutTimer: number = 0;
	private isInProgress: boolean = false;
	private curCheckStartTime: number = 0;
	private isCheckRunning: boolean = false;
	private lastReportedTimeStr: string = '';
	private img: HTMLImageElement = new Image();
	private elms: {
		legendFast: HTMLElement | null;
		legendSlow: HTMLElement | null;
		legendColors: HTMLElement | null;
		legendTimeout: HTMLElement | null;
		legendError: HTMLElement | null;
		legendTimestamp: HTMLElement | null;
		container: HTMLElement | null;
	};

	constructor(private config: Config) {
		this.img.onload = () => {
			this.onLoad();
		};
		this.img.onerror = () => {
			this.onError();
		};
		this.elms = {
			legendFast: document.getElementById('snc-legend-fast'),
			legendColors: document.getElementById('snc-legend-colors'),
			legendSlow: document.getElementById('snc-legend-slow'),
			legendTimeout: document.getElementById('snc-legend-timeout'),
			legendError: document.getElementById('snc-legend-error'),
			legendTimestamp: document.getElementById('snc-legend-timestamp'),
			container: document.getElementById('snc-container'),
		};
		this.displayLegend();
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

	displayLegend() {
		if (
			this.elms.legendFast &&
			this.elms.legendSlow &&
			this.elms.legendColors &&
			this.elms.legendTimeout &&
			this.elms.legendError &&
			this.elms.legendTimestamp
		) {
			this.elms.legendFast.textContent = `${this.config.RESPONSE_TIME_FAST}ms`;
			this.elms.legendSlow.textContent = `${this.config.RESPONSE_TIME_SLOW}ms`;
			this.elms.legendColors.style.background = `linear-gradient(to right, hsl(${this.config.COLOR_BG_HUE_FASTEST} 100% 50%), hsl(${Math.trunc(
				(this.config.COLOR_BG_HUE_FASTEST - this.config.COLOR_BG_HUE_SLOWEST) / 2,
			)} 100% 50%), hsl(${this.config.COLOR_BG_HUE_SLOWEST} 100% 50%))`;
			this.addPoint(this.elms.legendTimeout, this.config.COLOR_BG_TIMEOUT, this.config.COLOR_TEXT_TIMEOUT, this.config.TEXT_TIMEOUT);
			this.addPoint(this.elms.legendError, this.config.COLOR_BG_ERROR, this.config.COLOR_TEXT_ERROR, this.config.TEXT_ERROR);
			this.addPoint(this.elms.legendTimestamp, this.config.COLOR_BG_TIMESTAMP, this.config.COLOR_TEXT_TIMESTAMP, '00:00');
		}
	}

	getCurrentTime() {
		let timeStr = '';
		const now = new Date();
		let hh = now.getHours();
		if (hh < 10) {
			timeStr += '0';
		}
		timeStr += hh.toString();
		timeStr += ':';
		let mm = now.getMinutes();
		if (mm < 10) {
			timeStr += '0';
		}
		timeStr += mm.toString();
		return timeStr;
	}

	addPoint(containerElm: HTMLElement | null, bgColor: string, textColor: string, text: string) {
		if (!containerElm) {
			return;
		}
		const elm: HTMLElement = document.createElement('DIV');
		elm.classList.add('snc-point');
		elm.style.backgroundColor = bgColor;
		elm.style['color'] = textColor;
		elm.textContent = text;
		containerElm.appendChild(elm);
	}

	handleTime() {
		const currentTimeStr = this.getCurrentTime();
		if (currentTimeStr === this.lastReportedTimeStr) {
			return;
		}
		this.addPoint(this.elms.container, this.config.COLOR_BG_TIMESTAMP, this.config.COLOR_TEXT_TIMESTAMP, currentTimeStr);
		this.lastReportedTimeStr = currentTimeStr;
	}

	onCheckDone(bgColor: string, textColor: string, text: string) {
		clearTimeout(this.timeoutTimer);
		this.isInProgress = false;
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
		let h;
		if (checkTime <= this.config.RESPONSE_TIME_FAST) {
			h = 1;
		} else if (checkTime >= this.config.RESPONSE_TIME_SLOW) {
			h = 0;
		} else {
			h = 1 - (checkTime - this.config.RESPONSE_TIME_FAST) / (this.config.RESPONSE_TIME_SLOW - this.config.RESPONSE_TIME_FAST);
		}
		const hue = Math.trunc(h * (this.config.COLOR_BG_HUE_FASTEST - this.config.COLOR_BG_HUE_SLOWEST) + this.config.COLOR_BG_HUE_SLOWEST);
		this.onCheckDone(`hsl(${hue} 100% 50%)`, this.config.COLOR_TEXT_REGULAR, checkTime.toString());
	}

	onTimeout() {
		if (!this.isInProgress) {
			return;
		}
		this.onCheckDone(this.config.COLOR_BG_TIMEOUT, this.config.COLOR_TEXT_TIMEOUT, this.config.TEXT_TIMEOUT);
	}

	onError() {
		if (!this.isInProgress) {
			return;
		}
		this.onCheckDone(this.config.COLOR_BG_ERROR, this.config.COLOR_TEXT_ERROR, this.config.TEXT_ERROR);
	}

	getImgSrc() {
		return this.config.IMG_SRC + '?cachebreaker=' + new Date().getTime();
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

const config = {
	IMG_SRC: './img/pixel.png',
	//IMG_SRC: 'https://www.google.com/favicon.ico',
	//IMG_SRC: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
	//IMG_SRC: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
	CHECK_FREQ: 3000,
	RESPONSE_TIME_FAST: 50,
	RESPONSE_TIME_SLOW: 500,
	RESPONSE_TIMEOUT: 2500,
	COLOR_BG_TIMESTAMP: '#999',
	COLOR_TEXT_TIMESTAMP: '#000',
	COLOR_BG_HUE_FASTEST: 180,
	COLOR_BG_HUE_SLOWEST: 0,
	COLOR_TEXT_REGULAR: '#000',
	COLOR_BG_TIMEOUT: 'hsl(270 100% 50%)',
	COLOR_TEXT_TIMEOUT: '#fff',
	TEXT_TIMEOUT: 'T.O.',
	COLOR_BG_ERROR: 'hsl(330 100% 45%)',
	COLOR_TEXT_ERROR: '#fff',
	TEXT_ERROR: 'ERR',
};
const connChecker = new ConnChecker(config);
connChecker.startChecks();
