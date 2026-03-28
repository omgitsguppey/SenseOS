import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/media?userId=123&projectId=gen-lang-client-0938925035', {
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}

test();
