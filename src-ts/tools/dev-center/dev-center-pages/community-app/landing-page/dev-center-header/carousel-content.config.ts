import CodeImage from '../../../../carousel-images/Code.png'

/**
 * This is the interface implemented by the data
 * of every item in the Carousel
 */
export interface CarouselItem {
  headline: string
  image: string
  isNewFeature?: boolean
  summary: string
}

/**
 * Each item in the array represent a screen of the carousel and should contain:
 * - headline: the title of the screen
 * - summary: a short description of what is represented in this screen
 * - image: the link to the image to be shown in this screen
 * - isNewFeature: true if the screen should have the "NEW FEATURE" tag, false otherwise
 */
export const CarouselContent: Array<CarouselItem> = [
    {
      headline: 'Introducing new feature: API Explorer',
      image: CodeImage,
      isNewFeature: true,
      summary: 'Now You Can Try Topcoder API Methods Without Writing Code.',
    },
    {
      headline: 'Lorem ipsum dolor sit amet',
      image: CodeImage,
      summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, minim veniam',
    },
    {
      headline: 'Lorem ipsum dolor sit amet',
      image: CodeImage,
      summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed dominim veniam',
    },
    {
      headline: 'Lorem ipsum dolor sit amet',
      image: CodeImage,
      summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed dominim veniam',
    },
    {
      headline: 'Lorem ipsum dolor sit amet',
      image: CodeImage,
      summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed dominim veniam',
    },
   ]
