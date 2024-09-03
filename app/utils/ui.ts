import { createSystem } from "frog/ui";

export const {
  Box,
  Columns,
  Column,
  Heading,
  HStack,
  Rows,
  Row,
  Spacer,
  Text,
  VStack,
  Image,
  vars,
} = createSystem({
  colors: {
    text: "#FEC249",
    white: "#FFFFFF",
    red: "#f13342",
    background: "#693A9D",
  },
  fonts: {
    default: [
      {
        name: "Open Sans",
        source: "google",
        weight: 400,
      },
      {
        name: "Open Sans",
        source: "google",
        weight: 600,
      },
    ],
    madimi: [
      {
        name: "Madimi One",
        source: "google",
      },
    ],
    montserrat: [
      {
        name: "Montserrat",
        source: "google",
        weight: 800,
      },
      {
        name: "Montserrat",
        source: "google",
        weight: 700,
      },
      {
        name: "Montserrat",
        source: "google",
        weight: 600,
      },
      {
        name: "Montserrat",
        source: "google",
        weight: 400,
      },
    ],
  },
});
