async function checkBucket() {
  const url1 = 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0938925035.firebasestorage.app/o';
  const res1 = await fetch(url1);
  console.log('url1:', res1.status, await res1.text());
}

checkBucket();
