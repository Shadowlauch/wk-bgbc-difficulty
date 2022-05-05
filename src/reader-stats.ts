import fetch from 'node-fetch';
import {ChartConfiguration} from 'chart.js';
import {promises as fs} from 'fs';
import {ChartCallback, ChartJSNodeCanvas} from 'chartjs-node-canvas';

interface WeeklyStats {
  posts: number,
  views: number,
  readers: number
}

const main = async (id: number, regex: RegExp, ongoing = false) => {
  const response = await fetch(`https://community.wanikani.com/t/${id}.json`).then(r => r.json());
  const main = response.post_stream.posts[0] as Record<string, any>
  const links = main.link_counts.filter((l: any) => regex.exec(l.title) !== null);
  links.sort((a: any, b: any) => a.title > b.title ? 1 : -1);

  const stats: WeeklyStats[] = [];
  for await (const link of links) {
    const thread = await fetch(link.url + ".json").then(r => r.json());

    stats.push({
      posts: thread.posts_count,
      views: thread.views,
      readers: thread.post_stream.posts[0].polls[0].options[0].votes + thread.post_stream.posts[0].polls[0].options[1].votes
    })
  }
  if (ongoing) stats.splice(-1)
  const width = 1200;
  const height = 600;
  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels: stats.map((s, i) => `Week ${i + 1}`),
      datasets: [
        {
          label: 'posts',
          data: stats.map(s => s.posts),
          backgroundColor: ['rgba(255, 99, 132, 0.8)'],
          borderColor: ['rgba(255, 99, 132, 1)']
        },
        {
          label: 'readers',
          data: stats.map(s => s.readers),
          backgroundColor: ['rgba(153, 102, 255, 0.8)'],
          borderColor: ['rgba(153, 102, 255, 1)']
        },
        {
          label: 'views',
          type: 'bar',
          yAxisID: 'views',
          data: stats.map(s => s.views),
          backgroundColor: ['rgba(75, 192, 192, 0.4)'],
          borderColor: ['rgba(75, 192, 192, 0.2)']
        }
      ]
    },
    options: {
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
        },
        views: {
          title: {
            display: true,
            text: 'Views'
          },
          type: 'linear',
          display: true,
          position: 'right',

          // grid line settings
          grid: {
            drawOnChartArea: false, // only want the grid lines for one axis to show up
          },
        }
      }
    },
    plugins: [{
      id: 'background-colour',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }]
  };
  const chartCallback: ChartCallback = (ChartJS) => {
    ChartJS.defaults.responsive = true;
    ChartJS.defaults.maintainAspectRatio = false;
  };
  const chartJSNodeCanvas = new ChartJSNodeCanvas({width, height, chartCallback});
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  await fs.writeFile('./example.png', buffer, 'base64');

};

main(54575, /Death Note \| Week [0-9]+ Discussion/, false).then();
//main(54153, /極主夫道 \| Week [0-9]+ Discussion/).then();


