const xml2js = require('xml2js');
const axios = require('axios');

async function testArXivAPI() {
  try {
    const url = 'http://export.arxiv.org/api/query?search_query=all:embodied+ai&start=0&max_results=1';
    const response = await axios.get(url, {
      headers: { 'Accept': 'application/xml' },
    });

    const result = await xml2js.parseStringPromise(response.data);
    console.log(JSON.stringify(result.feed.entry[0], null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testArXivAPI();
