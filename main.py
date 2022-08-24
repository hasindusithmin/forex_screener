
from fastapi import FastAPI,Request,HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder
import investpy
import numpy as np
import yfinance as yf
from datetime import datetime
########################################################################################

# Create `app` instance 
app = FastAPI()

# Create 'templates' instance 
templates = Jinja2Templates(directory='templates')

@app.get('/')
def root(request:Request):
    return templates.TemplateResponse('index.html', {'request':request})

@app.get('/pivot-point/{interval}')
async def get_pivot_point(base:str,quote:str,interval:str):
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
            headers[4]:row[headers[4]],
            headers[5]:row[headers[5]],
            headers[6]:row[headers[6]],
            headers[7]:row[headers[7]]
        })
    return jsonable_encoder(rows)

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
        period = "5d" if interval in ["5m","15m","30m","60m"] else "max"
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
        raise HTTPException(status_code=400,detail="query or path invalid")    
    
