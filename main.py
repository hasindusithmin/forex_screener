
from fastapi import FastAPI,Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

########################################################################################

# Create `app` instance 
app = FastAPI()

# Create 'templates' instance 
templates = Jinja2Templates(directory='templates')

@app.get('/')
def root(request:Request):
    return templates.TemplateResponse('index.html', {'request':request})
