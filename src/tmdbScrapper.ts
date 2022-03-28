import dotenv from "dotenv";
import puppeteer = require("puppeteer");

import mongoose, { ConnectOptions } from "mongoose";
import {
  PopularMovie,
  NowShowingMovie,
  TopRatedMovie,
  CommingSoondMovie,
  IMovie,
} from "./models/movies";

dotenv.config();
const dbUrl = process.env.DB_URL;

mongoose
  .connect(`${dbUrl}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions)
  .then(() => {
    console.log("MONGO CONNECTION OPEN!!!!!!!");
  })
  .catch((err) => {
    console.log("OH NO MONGO CONNECTION ERROR!!!!");
    console.log(err);
  });

type Movie = {
  tmdbId: string;
  title: string | null;
  year: string | null;
  posterUrl: string | null;
  describtion: string | null;
  release: string | null;
  genres: string[] | null;
  rating: string | null;
  runtime: string | null;
  trailerYoutubeId: string | null;
  recommendations: Recomendation[] | null;
};
type Recomendation = {
  title: string | null;
  image: string | null;
  tmdbId: string;
};

async function scrap(
  url: string,
  category: mongoose.Model<IMovie, {}, {}, {}>
) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
  );

  //turns request interceptor on
  await page.setRequestInterception(true);

  //if the page makes a  request to a resource type of image or stylesheet then abort that request
  page.on("request", (request) => {
    if (
      request.resourceType() === "image" ||
      request.resourceType() === "stylesheet"
    )
      request.abort();
    else request.continue();
  });

  const loadMore = "#pagination_page_1 > p > a";
  let dataObj: Movie[] = [];

  await page.setViewport({
    width: 1920,
    // width: 1200,
    height: 1080,
    // height: 800,
  });
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    //click button Load more
    await page.waitForSelector("#page_1 > div", { visible: true });
    if (await page.$(loadMore)) {
      await page.focus(loadMore);
      await page.click(loadMore);
    }

    await autoScroll(page);

    const moviesDom = await page.$$eval(
      "[id^=page_] > div > div.content >h2 >a",
      (assetLinks) => assetLinks.map((link) => link.getAttribute("href")!)
    );

    //if want exact number numberof movies
    // const moviesDomAll = await page.$$eval('[id^=page_] > div > div.content >h2 >a', (assetLinks) =>
    //     assetLinks.map((link) => link.getAttribute('href')!)
    // );
    // const moviesDom = moviesDomAll.length > 501 ? moviesDomAll.slice(0, 500) : moviesDomAll;

    console.log(`${moviesDom.length} movies found: ${url}`);

    let newList: Movie[] = [];

    for await (const linkElement of moviesDom) {
      const link = `https://www.themoviedb.org/${linkElement}`;
      await Promise.all([
        page.waitForNavigation({ timeout: 60000 }),
        page.goto(link, {
          timeout: 30000,
          waitUntil: "networkidle2",
        }),

        await page.waitForSelector(
          "#media_v4 > div > div",

          { timeout: 60000 }
        ),
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight)
        ),
      ]);

      //Id
      const reg: RegExp = /[0-9]+/;
      const regId: RegExpExecArray | null = reg.exec(link);
      const tmdbId = regId ? regId[0] : "0";

      //Title
      const title = await page.evaluate(() => {
        const titleA = document.querySelector(
          "#original_header > div.header_poster_wrapper.false > section > div.title.ott_false > h2 > a"
        );
        if (titleA) {
          return titleA.textContent;
        }
        return null;
      });

      //Year
      const year = await page.evaluate(() => {
        const yearSpan = document.querySelector(
          "#original_header > div.header_poster_wrapper.false > section > div.title.ott_false > h2 > span"
        );
        if (yearSpan) {
          return yearSpan.textContent;
        }
        return null;
      });

      //Rating
      const rating = await page.evaluate(() => {
        const ratingDiv = document.querySelector(
          "#original_header > div.header_poster_wrapper.false > section > ul > li.chart > div.consensus.details"
        );
        if (ratingDiv) {
          return ratingDiv
            .querySelector("div")!
            .querySelector("div")!
            .getAttribute("data-percent");
        }
        return null;
      });

      //Runtime
      const runtimeSpan = await page.evaluate(() => {
        const runTimeText = document.querySelector(
          "#original_header > div.header_poster_wrapper.false > section > div.title.ott_false > div > span.runtime"
        );
        if (runTimeText) {
          return runTimeText.textContent;
        }
        return null;
      });
      let runtime;
      if (runtimeSpan) {
        const reg: RegExp = /[0-9]+h*.[0-9]+m/;
        const regId: RegExpExecArray | null = reg.exec(runtimeSpan);
        runtime = regId ? regId[0] : runtimeSpan;
      } else {
        runtime = null;
      }

      //describtion
      const describtion = await page.evaluate(() => {
        const describtionP = document.querySelector(
          "#original_header > div.header_poster_wrapper.false > section > div.header_info > div > p"
        );
        if (describtionP) {
          return describtionP.textContent;
        }
        return null;
      });

      //Trailed Youtube Id
      const trailerYoutubeId = await page.evaluate(() => {
        const trailerYoutubeLi = document.querySelector(
          "#original_header > div.header_poster_wrapper.false > section > ul > li.video.none"
        );
        if (trailerYoutubeLi) {
          return trailerYoutubeLi.querySelector("a")!.getAttribute("data-id");
        }
        return null;
      });

      //Movie poster Url
      const posterUrl = await page.evaluate(() => {
        const posterUrlDiv = document.querySelector(
          "#original_header > div.poster_wrapper.false > div > div.image_content.backdrop > img"
        );
        if (posterUrlDiv) {
          return posterUrlDiv.getAttribute("src");
        }
        return null;
      });

      //Movie release date
      const releaseDate = await page.evaluate(() => {
        const releaseSpan = document.querySelector(
          "#original_header > div.header_poster_wrapper.false > section > div.title.ott_false > div > span.release"
        );
        if (releaseSpan) {
          return releaseSpan.textContent;
        }
        return null;
      });
      let release;
      if (releaseDate) {
        const reg: RegExp = /([0-9]+(\/[0-9]+)+)/;
        const regId: RegExpExecArray | null = reg.exec(releaseDate);
        release = regId ? regId[0] : releaseDate;
      } else {
        release = null;
      }

      //Genres Array
      const genres = await page.evaluate(() => {
        let genresArray: string[] = [];
        const genresDom = document.querySelectorAll(
          "section > div.title.ott_false > div > span.genres > a "
        );
        //
        if (genresDom) {
          for (const url of genresDom) {
            const genre = url.innerHTML;
            genresArray.push(genre);
          }
          return genresArray;
        }
        return null;
      });

      //Recomendations Array
      const recommendations = await page.evaluate(() => {
        let recommendationsArray: Recomendation[] = [];
        const recommendationsDom = document.querySelectorAll(
          "#recommendation_scroller > div > div > div > a"
        );

        if (recommendationsDom) {
          for (const url of recommendationsDom) {
            const title = url.getAttribute("title");
            const img = url.querySelector("img");
            let image: string | null;
            if (img) {
              image = img.getAttribute("src");
            } else {
              image = null;
            }
            const recommendationLink = url.getAttribute("href");
            let tmdbId = "";
            if (recommendationLink) {
              const reg: RegExp = /[0-9]+/;
              const regId: RegExpExecArray | null =
                reg.exec(recommendationLink);
              tmdbId = regId ? regId[0] : "0";
            }
            const movie: Recomendation = {
              tmdbId,
              title,
              image,
            };

            recommendationsArray.push(movie);
          }
          return recommendationsArray;
        }
        return null;
      });

      const movie: Movie = {
        tmdbId,
        title,
        year,
        posterUrl,
        describtion,
        release,
        genres,
        rating,
        runtime,
        trailerYoutubeId,
        recommendations,
      };

      newList.push(movie);
    }

    dataObj = newList;
    // console.log(dataObj);
  } catch (e) {
    console.log(e);
  }
  console.log("finished scraping");

  //save movies to database
  for (let movie of dataObj) {
    const movieNew = new category({
      tmdbId: movie.tmdbId,
      title: movie.title,
      year: movie.year,
      posterUrl: movie.posterUrl,
      describtion: movie.describtion,
      release: movie.release,
      genres: movie.genres,
      rating: movie.rating,
      runtime: movie.runtime,
      trailerYoutubeId: movie.trailerYoutubeId,
      recommendations: movie.recommendations,
    });
    try {
      await movieNew.save();
      console.log(`${movie.title} saved`);
    } catch (err) {
      console.log(err);
    }
  }
  console.log(`${url} data saved into db`);
  await browser.close();
}

scrap("https://www.themoviedb.org/movie?language=en", PopularMovie);
// scrap(
//   "https://www.themoviedb.org/movie/now-playing?language=en",
//   NowShowingMovie
// );
// scrap(
//   "https://www.themoviedb.org/movie/upcoming?language=en",
//   CommingSoondMovie
// );
// scrap("https://www.themoviedb.org/movie/top-rated?language=en", TopRatedMovie);

//infinity scroll
async function autoScroll(page: puppeteer.Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        var { scrollHeight } = document.body;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
