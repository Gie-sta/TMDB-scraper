import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose, { ConnectOptions } from "mongoose";
import bodyParser from "body-parser";

import {
  PopularMovie,
  NowShowingMovie,
  TopRatedMovie,
  CommingSoondMovie,
} from "./models/movies";

//connect mongoose
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

const app = express();

const allowedOrigins = ["http://localhost:8080", "http://localhost:3000"];

const options: cors.CorsOptions = {
  origin: allowedOrigins,
};

app.use(cors(options));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = 8080;

//get popular movies
app.get("/movies", async (req, res) => {
  const movies = await PopularMovie.find({});
  res.json(movies);
});
//get Now playing movies
app.get("/movies/nowplaying", async (req, res) => {
  const movies = await NowShowingMovie.find({});
  res.json(movies);
});
//get coming soon movies
app.get("/movies/comingsoon", async (req, res) => {
  const movies = await CommingSoondMovie.find({});
  res.json(movies);
});
//get top rated movies
app.get("/movies/toprated", async (req, res) => {
  const movies = await TopRatedMovie.find({});
  res.json(movies);
});

//get movie details
app.get("/movies/:id", async (req, res) => {
  console.log(req.params.id);
  const moviePopular = await PopularMovie.findOne({ tmdbId: req.params.id });
  const movieTopRated = await TopRatedMovie.findOne({ tmdbId: req.params.id });
  const movieNow = await NowShowingMovie.findOne({ tmdbId: req.params.id });
  const movieSoon = await CommingSoondMovie.findOne({ tmdbId: req.params.id });
  let movie;
  if (moviePopular) {
    movie = moviePopular;
  } else if (movieTopRated) {
    movie = movieTopRated;
  } else if (movieNow) {
    movie = movieNow;
  } else {
    movie = movieSoon;
  }

  // console.log(movie);
  res.json(movie);
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
