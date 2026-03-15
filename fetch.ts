fetch('https://ibb.co/4R3BSg4b').then(r=>r.text()).then(t=>{
  const match = t.match(/<meta property="og:image" content="([^"]+)"/);
  if (match) console.log(match[1]);
});
