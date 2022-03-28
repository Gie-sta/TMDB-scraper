# TMDB-scraper

Scraps TMDB with Puppeteer, saves to MongoDB and creates backend API using Node.

## Run scraper

npx tsc && nodemon dist/tmdbScrapper.js

Scraps movies data from themoviedb.org. Can scrap: Popular movies, Top rated movies, Comming Soon movies and Now Playning movies.
Saves movies into MongoDb.

## Run Backend API

npm start

**get popular movies**
/movies

**get Now playing movies**
/movies/nowplaying

**get coming soon movies**
/movies/comingsoon

**get top rated movies**
/movies/toprated

**get movie details**
/movies/:id
