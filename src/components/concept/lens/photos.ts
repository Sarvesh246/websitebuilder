export type LensCategory = "Landscape" | "Portrait" | "Street";

export type LensPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  category: LensCategory;
  title: string;
  place: string;
  year: string;
  alt: string;
};

const p = (
  id: string,
  width: number,
  height: number,
  category: LensCategory,
  title: string,
  place: string,
  year: string,
  alt: string,
): LensPhoto => ({ id, src: `/images/work/lens/${id}.webp`, width, height, category, title, place, year, alt });

export const lensPhotos: readonly LensPhoto[] = [
  p("alpine", 1600, 1067, "Landscape", "Last Light on the Cirque", "Dolomites, Italy", "2023", "Sunset light on jagged peaks above a still mountain lake"),
  p("blue", 1600, 2000, "Portrait", "Violet Hour", "Studio, Lisbon", "2024", "Portrait of a woman lit in blue and violet light"),
  p("valley", 1600, 1068, "Landscape", "The River Keeps Its Own Time", "Yosemite Valley, USA", "2022", "A wide valley with granite walls and a river winding through"),
  p("street", 1600, 1067, "Street", "Avenue, Rush Hour", "New York, USA", "2023", "A city avenue lined with yellow taxis"),
  p("road", 1600, 2400, "Landscape", "Two Lanes South", "Monument Valley, USA", "2021", "A desert road running between red rock formations"),
  p("mono", 1600, 1600, "Portrait", "Profile in Grey", "Studio, Berlin", "2024", "Black and white profile portrait of a bearded man"),
  p("stars", 1600, 1068, "Landscape", "Nine Hundred Seconds", "Lofoten, Norway", "2023", "The Milky Way arching over snow covered peaks at night"),
  p("portrait", 1600, 1067, "Portrait", "Lake, Late Afternoon", "Lake Como, Italy", "2022", "A young woman standing in front of a lake"),
  p("dusk", 1600, 1067, "Street", "Golden Towers", "Chicago, USA", "2022", "Skyscrapers glowing at golden hour"),
  p("ridge", 1600, 953, "Landscape", "Green Cliffs, Low Cloud", "Faroe Islands", "2021", "Green sea cliffs under low cloud at sunset"),
  p("forest", 1600, 1066, "Landscape", "Path Through the Morning", "Black Forest, Germany", "2020", "A sunlit forest path between tall trees"),
];
