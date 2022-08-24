const chartOpts = {
	width: 600,
	height: 400,
	layout: {
		backgroundColor: '#000000',
		textColor: 'rgba(255, 255, 255, 0.9)',
	},
	grid: {
		vertLines: {
			color: 'rgba(197, 203, 206, 0.5)',
		},
		horzLines: {
			color: 'rgba(197, 203, 206, 0.5)',
		},
	},
	crosshair: {
		mode: LightweightCharts.CrosshairMode.Normal,
	},
	rightPriceScale: {
		borderColor: 'rgba(197, 203, 206, 0.8)',
	},
	timeScale: {
		borderColor: 'rgba(197, 203, 206, 0.8)',
		timeVisible: true,
	},
}

const candlestickOpts = {
	upColor: 'rgba(255, 144, 0, 1)',
	downColor: '#000',
	borderDownColor: 'rgba(255, 144, 0, 1)',
	borderUpColor: 'rgba(255, 144, 0, 1)',
	wickDownColor: 'rgba(255, 144, 0, 1)',
	wickUpColor: 'rgba(255, 144, 0, 1)',
}

// Step i 
const chart = LightweightCharts.createChart(document.getElementById('chart'), chartOpts);
// Step ii 
const candleSeries = chart.addCandlestickSeries(candlestickOpts);
// Step iii 
fetch('/history/5m?quote=EUR&base=USD')
	.then(res => res.json())
	.then(data => {
		candleSeries.setData(data)
	})
const intervals = {
	"5m": "5mins",
	"15m": "15mins",
	"30m": "30mins",
	"1h": "1hour",
	"1d": "daily",
	"1wk": "weekly",
	"1mo": "monthly"
}

document.getElementById('history').onsubmit = async (e) => {
	e.preventDefault()
	document.getElementById('notification').innerText = ''
	const base = e.target.base.value;
	const quote = e.target.quote.value;
	const interval = e.target.interval.value;
	sessionStorage.setItem('quote', quote)
	sessionStorage.setItem('base', base)
	sessionStorage.setItem('interval', interval)
	const res = await fetch(`/history/${interval}?base=${base}&quote=${quote}`)
	if (res.status === 400) {
		document.getElementById('notification').className = 'w3-text-red'
		document.getElementById('notification').innerText = `No data found, symbol(${quote}/${base}) may be delisted`
	}
	if (res.ok) {
		document.getElementById('notification').className = 'w3-text-green'
		document.getElementById('notification').innerText = `${quote}/${base} ${interval}`
		document.getElementById('title').innerHTML = `${quote}/${base} ${intervals[interval]}`
		const data = await res.json()
		if (data.length < 10) alert('Lack of data')
		candleSeries.setData(data)
	}
}

document.getElementById('pivot-point').onsubmit = async (e) => {
	e.preventDefault()
	document.getElementById('pivot-point-notification').innerText = ''
	const base = sessionStorage.getItem('base')
	const quote = sessionStorage.getItem('quote')
	const interval = sessionStorage.getItem('interval')
	if (base == undefined && quote == undefined && interval == undefined) {
		document.getElementById('pivot-point-notification').innerText = 'First, you need to select a currency pair and need to click the submit button.'
		document.getElementById('pivot-point-notification').className = 'w3-text-red'
	}
	else {
		const res = await fetch(`/pivot-point/${intervals[interval]}?quote=${quote}&base=${base}`)

		if (res.status == 400) {
			document.getElementById('pivot-point-notification').innerText = 'Data does not exists'
			document.getElementById('pivot-point-notification').className = 'w3-text-red'
		}

		else {
			// Step 0 
			document.getElementById('chart').innerHTML = ''
			// Step i 
			const chart = LightweightCharts.createChart(document.getElementById('chart'), chartOpts);
			// Step ii 
			const candleSeries = chart.addCandlestickSeries(candlestickOpts);
			// Step iii 
			fetch(`/history/${interval}?quote=${quote}&base=${base}`)
				.then(res => res.json())
				.then(data => {
					candleSeries.setData(data)
				})

			// Step 01 
			const data = await res.json()
			const type = e.target.type.value;
			// Step 02 
			const formData = new FormData(document.getElementById('pivot-point'))
			let lines = []
			for (let [name, value] of formData) {
				if (name == 'type') continue
				lines.push(name)
			}
			// Step 03
			let required = {}
			for (let dt of data) {
				const { name } = dt;
				if (type == name) required = dt
			}
			// If not override required object 
			if (Object.keys(required).length === 0) {
				document.getElementById('pivot-point-notification').innerText = `Sorry ${type} data not exists!`
				document.getElementById('pivot-point-notification').className = 'w3-text-red'
			}

			// Step 04 
			if (lines.length !== 0) {
				lines.forEach(line => {
					let color = (line.startsWith('s')) ? '#0b5be6' : '#e60b54'
					if (line == 'p') color = '#f2f2eb'
					const opts = {
						price: required[line],
						color: color,
						lineWidth: 2,
						lineStyle: LightweightCharts.LineStyle.Solid,
						axisLabelVisible: true,
						title: line.toUpperCase(),
						visible: false
					}
					candleSeries.createPriceLine(opts)
					chart.timeScale().fitContent();
				})
			}
			document.getElementById('title').innerHTML = `${quote}/${base} ${intervals[interval]}`
			lines = []

		}
	}



}



