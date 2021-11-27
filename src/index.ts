import fetch from 'node-fetch';

(async () => {
  const response = await fetch("https://community.wanikani.com/posts/542488.json").then(r => r.json()) as Record<string, any>;
  const regex = new RegExp(/\[([A-Za-z'\- ]*) Nomination Post]\(([^)]+)\)/g);
  const matches = response.raw.matchAll(regex);

  for await (const match of matches) {
    const [, name, link] = match;

    const pos = parseInt(link.split('/').pop()) + 1;
    const post = await fetch("https://community.wanikani.com/t/19766/posts.json?post_number=" + pos).then(r => r.json()) as Record<string, any>;

    const poll = post.post_stream.posts[0].polls[0];
    let sumDif = 0;
    let votes = 0;

    for (let i = 0; i < Math.min(5, poll.options.length); i++) {
      const option = poll.options[i];
      sumDif += (option.votes * (i + 1));
      votes += option.votes;
    }

    console.log(`${name} - Difficulty: ${(sumDif / votes).toFixed(2)} - Votes: ${votes}`);
  }

})();
