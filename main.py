
from fastapi import FastAPI,Request,HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder
from fastapi.staticfiles import StaticFiles
import investpy
import numpy as np
import yfinance as yf
import pandas as pd
import talib as ta
from datetime import datetime
########################################################################################

# Create `app` instance 
app = FastAPI()

app.mount('/public', StaticFiles(directory='static'), name='static')

# Create 'templates' instance 
templates = Jinja2Templates(directory='templates')

@app.get('/')
def root(request:Request):
    return templates.TemplateResponse('index.html', {'request':request})

@app.get('/pivot-point/{interval}')
async def get_pivot_point(base:str,quote:str,interval:str):
    try:
        # To uppercase 
        base, quote = base.upper(), quote.upper()
        # start Validate base and quote  
        cross = investpy.currency_crosses.get_available_currencies()
        is_valid = True if base in cross else False
        if not is_valid:
            raise HTTPException(status_code=400,detail="invaild query(base)")
        is_valid = True if quote in cross else False
        if not is_valid:
            raise HTTPException(status_code=400,detail="invaild query(quote)")
        # end Validate base and quote 

        # start Validate interval 
        intervals = ['5mins', '15mins', '30mins', '1hour', '5hours', 'daily', 'weekly', 'monthly']
        is_valid = True if interval in intervals else False
        if not is_valid:
            raise HTTPException(status_code=400,detail="invaild query(interval)")
        # end Validate interval 

        # If all condition ok!
        df = investpy.technical.pivot_points(name=f'{quote}/{base}', country=None, product_type='currency_cross', interval=interval)
        headers = df.columns.values.tolist()
        rows = []
        for index,row in df.iterrows():
            values = [np.isnan(row[headers[i]]) for i in range(len(row)) if not type(row[headers[i]]) == str]
            if True in values:
                continue
            rows.append({
                headers[0]:row[headers[0]],
                headers[1]:row[headers[1]],
                headers[2]:row[headers[2]],
                headers[3]:row[headers[3]],
                'p':row[headers[4]],
                headers[5]:row[headers[5]],
                headers[6]:row[headers[6]],
                headers[7]:row[headers[7]]
            })
        return jsonable_encoder(rows)
    except:
        raise HTTPException(status_code=400)

@app.get('/history/{interval}')
async def get_historical(base:str,quote:str,interval:str):
    # To uppercase 
    base, quote = base.upper(), quote.upper()
    """
    no need to validate path & query parameters
    """
    try:
        ticker = yf.Ticker(f'{quote}{base}=X')
        # get historical market data
        period = "5d" if interval in ["5m","15m","30m","60m","1h"] else "max"
        df = ticker.history(period=period,interval=interval)
        # If df empty 
        if df.empty:
            print('empty')
            raise HTTPException(status_code=400,detail="ticker not found")
        df = df.reset_index()
        head = df.columns.values.tolist()
        candles = []
        for index,row in df.iterrows():
            time = row[head[0]].to_pydatetime()
            time = datetime.timestamp(time)
            candles.append({
                'time': int(time + 19800),
                'open': row[head[1]],
                'high': row[head[2]],
                'low': row[head[3]],
                'close': row[head[4]]
            })
        return candles
    except:
        raise HTTPException(status_code=400,detail="ticker not found")    
    
@app.get('/pattern/{pattern}')
async def get_pattern(pattern:str,symbol:str,timeframe:str):
    """
    No need to validate query and path variables
    """
    try:
        symbol = f'{symbol}=X'
        available = ['CDL3OUTSIDE','CDL3INSIDE','CDLINVERTEDHAMMER', 'CDLHARAMICROSS' ,'CDLHARAMI' ,'CDLENGULFING','CDLDOJI','CDLDRAGONFLYDOJI' , 'CDLRISEFALL3METHODS','CDLXSIDEGAP3METHODS','CDLDOJISTAR' ,'CDLBELTHOLD','CDLADVANCEBLOCK','CDL3BLACKCROWS','CDLSHOOTINGSTAR', 'CDLSEPARATINGLINES']
        # Going to get OHLC
        period = "5d" if timeframe in ["5m","15m","30m","60m","1h"] else "max"
        df = yf.Ticker(symbol).history(period=period,interval=timeframe)
        # List -> Numpy.Array 
        open,high,low,close = np.array(df.Open.to_list()),np.array(df.High.to_list()),np.array(df.Low.to_list()),np.array(df.Close.to_list())
        # Pattern Result 
        result = list(eval(f'ta.{pattern}(open,high,low,close)'))
        # Create `mydf` DataFrame 
        mydf = pd.DataFrame({'Time':df.index.to_list(),pattern:result})
        # Override `mydf` 
        mydf = mydf[mydf[pattern] != 0]
        both = True in [e < 0 for e in mydf[pattern].to_list()]
        if both:
            mydf['Status'] = ['UP' if e > 0 else 'DOWN' for e in mydf[pattern].to_list()]
        data = []
        for index,row in mydf.iterrows():
            time = row['Time'].to_pydatetime()
            time = int(datetime.timestamp(time)) + 19800
            if 'Status' in row.keys():
                data.append({'time':time,'status':row['Status']})
            else:
                data.append({'time':time})
        return data
    except:
        raise HTTPException(status_code=400,detail="Something went wrong")
    