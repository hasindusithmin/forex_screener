function autocomplete(inp, arr) {
	/*the autocomplete function takes two arguments,
	the text field element and an array of possible autocompleted values:*/
	var currentFocus;
	/*execute a function when someone writes in the text field:*/
	inp.addEventListener("input", function (e) {
		var a, b, i, val = this.value;
		/*close any already open lists of autocompleted values*/
		closeAllLists();
		if (!val) { return false; }
		currentFocus = -1;
		/*create a DIV element that will contain the items (values):*/
		a = document.createElement("DIV");
		a.setAttribute("id", this.id + "autocomplete-list");
		a.setAttribute("class", "autocomplete-items");
		/*append the DIV element as a child of the autocomplete container:*/
		this.parentNode.appendChild(a);
		/*for each item in the array...*/
		for (i = 0; i < arr.length; i++) {
			/*check if the item starts with the same letters as the text field value:*/
			if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
				/*create a DIV element for each matching element:*/
				b = document.createElement("DIV");
				/*make the matching letters bold:*/
				b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
				b.innerHTML += arr[i].substr(val.length);
				/*insert a input field that will hold the current array item's value:*/
				b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
				/*execute a function when someone clicks on the item value (DIV element):*/
				b.addEventListener("click", function (e) {
					/*insert the value for the autocomplete text field:*/
					inp.value = this.getElementsByTagName("input")[0].value;
					/*close the list of autocompleted values,
					(or any other open lists of autocompleted values:*/
					closeAllLists();
				});
				a.appendChild(b);
			}
		}
	});
	/*execute a function presses a key on the keyboard:*/
	inp.addEventListener("keydown", function (e) {
		var x = document.getElementById(this.id + "autocomplete-list");
		if (x) x = x.getElementsByTagName("div");
		if (e.keyCode == 40) {
			/*If the arrow DOWN key is pressed,
			increase the currentFocus variable:*/
			currentFocus++;
			/*and and make the current item more visible:*/
			addActive(x);
		} else if (e.keyCode == 38) { //up
			/*If the arrow UP key is pressed,
			decrease the currentFocus variable:*/
			currentFocus--;
			/*and and make the current item more visible:*/
			addActive(x);
		} else if (e.keyCode == 13) {
			/*If the ENTER key is pressed, prevent the form from being submitted,*/
			e.preventDefault();
			if (currentFocus > -1) {
				/*and simulate a click on the "active" item:*/
				if (x) x[currentFocus].click();
			}
		}
	});
	function addActive(x) {
		/*a function to classify an item as "active":*/
		if (!x) return false;
		/*start by removing the "active" class on all items:*/
		removeActive(x);
		if (currentFocus >= x.length) currentFocus = 0;
		if (currentFocus < 0) currentFocus = (x.length - 1);
		/*add class "autocomplete-active":*/
		x[currentFocus].classList.add("autocomplete-active");
	}
	function removeActive(x) {
		/*a function to remove the "active" class from all autocomplete items:*/
		for (var i = 0; i < x.length; i++) {
			x[i].classList.remove("autocomplete-active");
		}
	}
	function closeAllLists(elmnt) {
		/*close all autocomplete lists in the document,
		except the one passed as an argument:*/
		var x = document.getElementsByClassName("autocomplete-items");
		for (var i = 0; i < x.length; i++) {
			if (elmnt != x[i] && elmnt != inp) {
				x[i].parentNode.removeChild(x[i]);
			}
		}
	}
	/*execute a function when someone clicks in the document:*/
	document.addEventListener("click", function (e) {
		closeAllLists(e.target);
	});
}

fetch('/public/currencies.json')
	.then(res => res.json())
	.then(countries => {
		autocomplete(document.getElementById("currency"), countries);
	})
const chartOpts = {
	width: 800,
	height: 600,
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
fetch('/history/5m?currency=EUR/USD')
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
	let currency = e.target.currency.value;
	const interval = e.target.interval.value;
	sessionStorage.setItem('currency', currency)
	sessionStorage.setItem('interval', interval)
	const res = await fetch(`/history/${interval}?currency=${currency}`)
	if (res.status === 400) {
		document.getElementById('notification').className = 'w3-text-red'
		document.getElementById('notification').innerText = `No data found, symbol(${quote}/${base}) may be delisted`
	}
	if (res.ok) {
		document.getElementById('notification').className = 'w3-text-green'
		document.getElementById('notification').innerText = `${currency} ${interval}`
		document.getElementById('title').innerHTML = `${currency} ${intervals[interval]}`
		const data = await res.json()
		if (data.length < 10) alert('Lack of data')
		candleSeries.setData(data)
		document.getElementById('title').innerHTML = `${currency} ${intervals[interval]}`
	}
}

document.getElementById('pivot-point').onsubmit = async (e) => {
	e.preventDefault()
	document.getElementById('pivot-point-notification').innerText = ''
	const currency = sessionStorage.getItem('currency')
	const interval = sessionStorage.getItem('interval')
	if (currency == undefined && interval == undefined) {
		document.getElementById('pivot-point-notification').innerText = 'First, you need to select a currency pair and need to click the submit button.'
		document.getElementById('pivot-point-notification').className = 'w3-text-red'
	}
	else {
		const res = await fetch(`/pivot-point/${intervals[interval]}?currency=${currency}`)

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
			fetch(`/history/${interval}?currency=${currency.replace('/', '')}`)
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
						title: `${line.toUpperCase()} : ${type}`,
					}
					candleSeries.createPriceLine(opts)
					chart.timeScale().fitContent();
				})
			}
			document.getElementById('title').innerHTML = `${currency} ${intervals[interval]}`
			lines = []
		}
	}
}


document.getElementById('pattern').onsubmit = async (e) => {
	e.preventDefault()
	document.getElementById('pattern-notification').innerText = ''
	const pattern = e.target.pattern.value;
	const pivot_type = e.target.type.value;
	const currency = sessionStorage.getItem('currency')
	const interval = sessionStorage.getItem('interval')
	if (currency == undefined && interval == undefined) {
		document.getElementById('pattern-notification').innerText = `First, you need to select a currency pair and need to click the submit button.`
		document.getElementById('pattern-notification').className = `w3-text-red`
	}
	else {
		fetch(`/history/${interval}?currency=${currency.replace('/', '')}`)
			.then(res => res.json())
			.then(data => {
				candleSeries.setData(data)
			})
		const pattern_res = await fetch(`/pattern/${pattern}?symbol=${currency.replace('/', '')}&timeframe=${interval}`)
		if (!pattern_res.ok) {
			document.getElementById('pattern-notification').innerText = `Sorry, ${currency} data not exists`
		}
		else {
			const formData = new FormData(document.getElementById('pattern'))
			let pivots = []
			for (let [name, value] of formData) {
				if (name == 'pattern' || name == 'type') continue
				pivots.push(name)
			}
			// Add pivot point to the chart 
			const pivot_res = await fetch(`/pivot-point/${intervals[interval]}?currency=${currency}`)
			if (!pivot_res.ok) {
				document.getElementById('pattern-notification').innerText = `Sorry, ${currency} pivot point data not exists`
			}
			else {
				const pivot_data = await pivot_res.json()
				let required = {}
				for (pd of pivot_data) {
					const { name } = pd;
					if (name == pivot_type) required = pd;
				}
				if (Object.keys(pivot_data).length === 0) {
					document.getElementById('pattern-notification').innerText = `Sorry ${pivot_type} data not exists!`
					document.getElementById('pattern-notification').className = 'w3-text-red'
				}
				else {
					if (pivots.length != 0) {
						pivots.forEach(pivot => {
							let color = (pivot.startsWith('s')) ? '#0000FF' : '#FF0000'
							if (pivot == 'p') color = '#FFFFFF'
							const opts = {
								price: required[pivot],
								color: color,
								lineWidth: 2,
								lineStyle: LightweightCharts.LineStyle.Solid,
								axisLabelVisible: true,
								title: `${pivot_type} ${pivot.toUpperCase()}`,
							}
							candleSeries.createPriceLine(opts)
							chart.timeScale().fitContent();
						})
					}
					// Add pattern data 
					const markers = []
					const pattern_data = await pattern_res.json()
					pattern_data.forEach(ptn => {
						const { time } = ptn
						let position = 'aboveBar'
						let shape = 'circle'
						let color = '#ffffff'
						if ('status' in ptn) {
							position = (ptn['status'] == 'UP') ? 'belowBar' : 'aboveBar'
							shape = (ptn['status'] == 'UP') ? 'arrowUp' : 'arrowDown'
							color = (ptn['status'] == 'UP') ? '#2196F3' : '#e91e63'
						}
						markers.push({ time: time, position: position, color: color, shape: shape, text: pattern })
					})
					candleSeries.setMarkers(markers)
					document.getElementById('title').innerHTML = `${currency} ${intervals[interval]}`
				}
			}
		}
	}
}


