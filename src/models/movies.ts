import { model, Schema, Document } from "mongoose";

type Recomendation = {
  title: string | null;
  tmdbId: string;
  image: string | null;
};
//1.  Create the interface
export interface IMovie extends Document {
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
}

// 2. Create a Schema corresponding to the document interface.
const movieSchema = new Schema<IMovie>({
  tmdbId: { type: String, required: true },
  title: { type: String, required: true },
  year: { type: String, required: true },
  posterUrl: { type: String, required: false },
  describtion: { type: String, required: true },
  release: { type: String, required: false },
  genres: { type: [String], required: false },
  rating: { type: String, required: false },
  runtime: { type: String, required: false },
  trailerYoutubeId: { type: String, required: false },
  recommendations: {
    type: [
      {
        title: { type: String, required: true },
        tmdbId: { type: String, required: true },
        image: { type: String, required: false },
      },
    ],
    required: false,
  },
});

// 3. Create and export user model
export const PopularMovie = model<IMovie>("Popular_Movie", movieSchema);
export const NowShowingMovie = model<IMovie>("Now_Showing_Movie", movieSchema);
export const TopRatedMovie = model<IMovie>("Top_Rated_Movie", movieSchema);
export const CommingSoondMovie = model<IMovie>(
  "Comming_Soon_Movie",
  movieSchema
);
