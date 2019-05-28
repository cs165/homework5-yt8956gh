const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');

const key = require('./privateSettings.json');

// TODO(you): Change the value of this string to the spreadsheet id for your
// GSA spreadsheet. See HW5 spec for more information.
const SPREADSHEET_ID = '1Ms0x8fiPuZMcbW52lqN0-IHmOjCdXqI4r0u112va3mU';

const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

async function onGet(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;
  console.log(rows);

  let fieldName = rows[0];
  let resJson = [];

  console.log(fieldName);

  for(let i=1;i<rows.length;i++)
  {
      let tmp={};

      for(let k=0;k<fieldName.length;k++)
      {
        tmp[fieldName[k]]=rows[i][k];
      }

      resJson.push(tmp);
  }
  res.json(resJson);
}
app.get('/api', onGet);

async function onPost(req, res) {
  const messageBody = req.body;
  const result = await sheet.getRows();
  const rows = result.rows;
  let  fieldName = rows[0];
  fieldName.forEach((Element,index,array)=>{
    array[index]=Element.toUpperCase();
  })

  let newRow=[];
  let keys = Object.keys(messageBody);
  let values = Object.values(messageBody);

  for(let i=0;i<keys.length;i++)
  {
    let index = fieldName.indexOf(keys[i].toUpperCase());
    newRow[index] = values[i];
  }

  console.log('NewRow: '+ newRow);

  res.json( await sheet.appendRow(newRow));
}
app.post('/api', jsonParser, onPost);

async function onPatch(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;
  const messageBody = req.body;

  const result = await sheet.getRows();
  const rows = result.rows;
  let fieldName = rows[0];

  let updateIndex = -1;
  let selectedColumn = -1;

  
  for(let i=0;i<rows[0].length;i++)
  {
    if(rows[0][i].toUpperCase()===column.toUpperCase())
    {
      selectedColumn=i;
      break;
    }
  }

  for(let i=1;i<rows.length;i++)
  {
    if(rows[i][selectedColumn]===value)
    {
      updateIndex=i;
      break;
    }
  }


  let newRow = rows[updateIndex];

  for(let i=0;i<fieldName.length;i++)
  {
    if(messageBody.hasOwnProperty(fieldName[i]))
    {
      newRow[i] = messageBody[fieldName[i]];
    }
  }

  console.log(newRow);

  res.json(await sheet.setRow(updateIndex, newRow));
}
app.patch('/api/:column/:value', jsonParser, onPatch);

async function onDelete(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;
  const result = await sheet.getRows();
  const rows = result.rows;
  let deleteIndex = -1;
  let selectedColumn = -1;

  
  for(let i=0;i<rows[0].length;i++)
  {
    if(rows[0][i].toUpperCase()===column.toUpperCase())
    {
      selectedColumn=i;
      break;
    }
  }

  for(let i=1;i<rows.length;i++)
  {
    if(rows[i][selectedColumn]===value)
    {
      deleteIndex=i;
      break;
    }
  }

  res.json(await sheet.deleteRow(deleteIndex));
}
app.delete('/api/:column/:value',  onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server listening on port ${port}!`);
});
