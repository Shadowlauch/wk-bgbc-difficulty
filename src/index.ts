import fetch from 'node-fetch';

(async () => {
  const response = await fetch("https://community.wanikani.com/posts/542488.json").then(r => r.json()) as Record<string, any>;
  const nomRegex = new RegExp(/\[Nomination Post]\(([^)]+)\)/);
  const natRegex = new RegExp(/\[Natively - (Level [0-9?]+)]\(([^)]+)\)/);
  const levelRegex = new RegExp(/L[0-9?]+/);
  const regex = new RegExp(/\[details="(Book|Manga) - (.+?(?="))"]([\S\s]*?(?=\[\/details]))\[\/details]/g);
  const matches = response.raw.matchAll(regex);
  const under10 = [];

  for await (const match of matches) {
    const [, type, name, content] = match;

    const [, nomLink] = content.match(nomRegex) ?? [];
    const [, level, natLink] = content.match(natRegex) ?? [];

    const pos = parseInt(nomLink.split('/').pop());
    const thread = await fetch(`https://community.wanikani.com/t/19766/${pos}.json`).then(r => r.json()) as Record<string, any>;
    const post = thread.post_stream.posts.find((p: any) => p.post_number === pos);

    const poll = post.polls[0];
    let sumDif = 0;
    let votes = 0;

    for (let i = 0; i < Math.min(5, poll.options.length); i++) {
      const option = poll.options[i];
      sumDif += (option.votes * (i + 1));
      votes += option.votes;
    }

    if (votes < 10) {
      under10.push(`* [${name}](${nomLink}) [${votes} votes]`);
    }

    let msgs = [];

    const nativelySrc = await fetch(natLink).then(r => r.text()) as string;
    const remoteLevel = nativelySrc.match(levelRegex)[0].replace('L', 'Level ');

    if (remoteLevel !== level) {
      msgs.push(remoteLevel);
    }

    const difString = `Difficulty: ${(sumDif / votes).toFixed(2)} [${votes} votes]`;
    if (!content.includes(difString)) {
      msgs.push(` - ${difString}`);
    }

    if (msgs.length > 0) {
      console.log(`${name}`);
      for (const msg of msgs) {
        console.log(msg);
      }
    }
  }

  for (const under10Element of under10) {
    console.log(under10Element)
  }

})();
