import type { User, Vibe } from "./types"

// Current user
export const currentUser: User = {
  id: "user-1",
  name: "Alex Johnson",
  avatar: "/placeholder.svg?height=100&width=100",
  joinDate: "2023-01-15T00:00:00Z",
}

// Sample users
const users: User[] = [
  currentUser,
  {
    id: "user-2",
    name: "Sofia Davis",
    avatar: "/placeholder.svg?height=100&width=100&text=SD",
    joinDate: "2022-11-03T00:00:00Z",
  },
  {
    id: "user-3",
    name: "Marcus Lee",
    avatar: "/placeholder.svg?height=100&width=100&text=ML",
    joinDate: "2023-02-22T00:00:00Z",
  },
  {
    id: "user-4",
    name: "Olivia Smith",
    avatar: "/placeholder.svg?height=100&width=100&text=OS",
    joinDate: "2022-09-14T00:00:00Z",
  },
  {
    id: "user-5",
    name: "Ethan Brown",
    avatar: "/placeholder.svg?height=100&width=100&text=EB",
    joinDate: "2023-03-30T00:00:00Z",
  },
]

// Sample vibes
export const sampleVibes: Vibe[] = [
  {
    id: "vibe-1",
    title: "Losing virginity but lying about not being your first time",
    description:
      "That awkward moment when you're trying to act experienced but have no idea what you're doing. A mix of nervousness, fake confidence, and the constant fear of being found out.",
    image: null, // Using placeholder
    createdBy: users[1],
    createdAt: "2023-05-12T14:23:00Z",
    ratings: [
      {
        user: users[0],
        rating: 4,
        review:
          "Too real. The anxiety of trying to seem experienced while having no clue what you're doing is a universal experience.",
        date: "2023-05-13T09:15:00Z",
      },
      {
        user: users[2],
        rating: 5,
        review: "The perfect mix of excitement and absolute terror. Been there, regretted that.",
        date: "2023-05-14T16:42:00Z",
      },
      {
        user: users[3],
        rating: 3,
        date: "2023-05-15T11:30:00Z",
      },
      {
        user: users[4],
        rating: 5,
        review: "The mental gymnastics required for this situation deserve an Olympic medal.",
        date: "2023-05-16T20:18:00Z",
      },
    ],
    tags: ["Awkward", "Embarrassing", "Life Milestone"],
    reactions: [
      { emoji: "😂", count: 24, users: ["user-1", "user-3", "user-5"] },
      { emoji: "😭", count: 12, users: ["user-2", "user-4"] },
      { emoji: "💯", count: 8, users: ["user-1"] },
      { emoji: "👀", count: 5, users: ["user-3"] },
    ],
  },
  {
    id: "vibe-2",
    title: "Being in a public restroom when the lights go out",
    description:
      "That moment of pure panic when you're in a public bathroom stall and suddenly everything goes dark. Time stops, your heart races, and you wonder if this is how your life ends.",
    image: null, // Using placeholder
    createdBy: users[2],
    createdAt: "2023-06-03T18:45:00Z",
    ratings: [
      {
        user: users[0],
        rating: 2,
        review: "Absolutely terrifying. Had this happen at an airport once and I still have nightmares.",
        date: "2023-06-04T10:22:00Z",
      },
      {
        user: users[1],
        rating: 1,
        review: "Pure horror movie material. -10/10 would not recommend.",
        date: "2023-06-05T14:37:00Z",
      },
      {
        user: users[3],
        rating: 2,
        date: "2023-06-06T09:15:00Z",
      },
    ],
    tags: ["Terrifying", "Bathroom Horror", "Public Spaces"],
    reactions: [
      { emoji: "😱", count: 32, users: ["user-1", "user-2"] },
      { emoji: "🚽", count: 18, users: ["user-3"] },
      { emoji: "🔦", count: 7, users: ["user-4"] },
    ],
  },
  {
    id: "vibe-3",
    title: "Finding $20 in old jeans you haven't worn in months",
    description:
      "That unexpected joy when you put on an old pair of jeans and discover money you forgot about. It's like a gift from your past self to your present self.",
    image: null, // Using placeholder
    createdBy: users[3],
    createdAt: "2023-04-22T11:30:00Z",
    ratings: [
      {
        user: users[0],
        rating: 5,
        review:
          "One of life's purest joys. Better than finding money on the street because it's technically already yours.",
        date: "2023-04-23T15:42:00Z",
      },
      {
        user: users[1],
        rating: 5,
        review: "The universe's way of saying 'here's a little treat for making it through another day'.",
        date: "2023-04-24T09:18:00Z",
      },
      {
        user: users[2],
        rating: 4,
        date: "2023-04-25T12:33:00Z",
      },
      {
        user: users[4],
        rating: 5,
        review: "Better than any lottery win. The perfect surprise.",
        date: "2023-04-26T17:55:00Z",
      },
    ],
    tags: ["Satisfying", "Unexpected Joy", "Money"],
    reactions: [
      { emoji: "🤑", count: 42, users: ["user-1", "user-2", "user-3"] },
      { emoji: "💰", count: 28, users: ["user-4"] },
      { emoji: "🎉", count: 15, users: ["user-5"] },
      { emoji: "👖", count: 9, users: ["user-1"] },
    ],
  },
  {
    id: "vibe-4",
    title: "Awkward elevator small talk with your boss",
    description:
      "That painfully long elevator ride where you're trapped with your boss and forced to make conversation about the weather, weekend plans, or worse - work.",
    image: null, // Using placeholder
    createdBy: users[4],
    createdAt: "2023-07-14T09:15:00Z",
    ratings: [
      {
        user: users[0],
        rating: 2,
        review: "The longest 30 seconds of your life. Every. Single. Time.",
        date: "2023-07-15T14:22:00Z",
      },
      {
        user: users[1],
        rating: 3,
        date: "2023-07-16T10:37:00Z",
      },
      {
        user: users[2],
        rating: 1,
        review: "I've started taking the stairs up 8 flights just to avoid this exact situation.",
        date: "2023-07-17T16:15:00Z",
      },
      {
        user: users[3],
        rating: 2,
        review: "The way time slows down should be studied by physicists.",
        date: "2023-07-18T11:48:00Z",
      },
    ],
    tags: ["Awkward", "Work Life", "Social Anxiety"],
    reactions: [
      { emoji: "😬", count: 38, users: ["user-1", "user-2"] },
      { emoji: "🙈", count: 22, users: ["user-3", "user-4"] },
      { emoji: "⏱️", count: 15, users: ["user-5"] },
    ],
  },
  {
    id: "vibe-5",
    title: "The moment you realize you've been singing the wrong lyrics",
    description:
      "That embarrassing realization when you confidently belt out lyrics to a song you've been singing for years, only to discover you've been completely wrong the entire time.",
    image: null, // Using placeholder
    createdBy: users[0],
    createdAt: "2023-08-05T16:42:00Z",
    ratings: [
      {
        user: users[1],
        rating: 4,
        review: "My entire childhood was a lie when I found out it wasn't 'Hold me closer, Tony Danza'.",
        date: "2023-08-06T10:15:00Z",
      },
      {
        user: users[2],
        rating: 3,
        date: "2023-08-07T14:30:00Z",
      },
      {
        user: users[3],
        rating: 4,
        review: "The mental recalibration required is intense. Sometimes I prefer my wrong version.",
        date: "2023-08-08T09:22:00Z",
      },
      {
        user: users[4],
        rating: 3,
        review: "A core memory that makes you question everything else you might be wrong about.",
        date: "2023-08-09T18:37:00Z",
      },
    ],
    tags: ["Embarrassing", "Music", "Realization"],
    reactions: [
      { emoji: "🎵", count: 27, users: ["user-1"] },
      { emoji: "😳", count: 19, users: ["user-2"] },
      { emoji: "🤦‍♂️", count: 14, users: ["user-3"] },
    ],
  },
  {
    id: "vibe-6",
    title: "Watching someone struggle with a door that says 'pull' when they're pushing",
    description:
      "That mixture of amusement and secondhand embarrassment when you watch someone repeatedly push a door clearly labeled 'pull', getting increasingly frustrated.",
    image: null, // Using placeholder
    createdBy: users[1],
    createdAt: "2023-09-18T13:25:00Z",
    ratings: [
      {
        user: users[0],
        rating: 4,
        review: "I feel both superior and sympathetic at the same time because I know I'll be that person tomorrow.",
        date: "2023-09-19T10:42:00Z",
      },
      {
        user: users[2],
        rating: 5,
        review: "The internal debate about whether to help them or just enjoy the show is the real vibe here.",
        date: "2023-09-20T15:18:00Z",
      },
      {
        user: users[3],
        rating: 4,
        date: "2023-09-21T09:33:00Z",
      },
      {
        user: users[4],
        rating: 3,
        review: "A perfect example of how design fails us daily. Also hilarious.",
        date: "2023-09-22T14:55:00Z",
      },
    ],
    tags: ["Funny", "Observational", "Public Spaces"],
    reactions: [
      { emoji: "🚪", count: 31, users: ["user-1"] },
      { emoji: "😆", count: 25, users: ["user-2"] },
      { emoji: "🤔", count: 12, users: ["user-3"] },
    ],
  },
  {
    id: "vibe-7",
    title: "Getting a text from an unknown number saying 'thanks for last night'",
    description:
      "That moment of confusion, panic, and intrigue when you receive a mysterious text thanking you for something you have no memory of doing.",
    image: null, // Using placeholder
    createdBy: users[2],
    createdAt: "2023-10-09T20:15:00Z",
    ratings: [
      {
        user: users[0],
        rating: 3,
        review: "The rollercoaster of emotions: confusion, panic, ego boost, then back to panic.",
        date: "2023-10-10T09:42:00Z",
      },
      {
        user: users[1],
        rating: 2,
        date: "2023-10-11T14:18:00Z",
      },
      {
        user: users[3],
        rating: 3,
        review: "The detective work that follows is worthy of a true crime podcast.",
        date: "2023-10-12T11:33:00Z",
      },
      {
        user: users[4],
        rating: 3,
        date: "2023-10-13T16:55:00Z",
      },
    ],
    tags: ["Confusing", "Text Messages", "Mystery"],
    reactions: [
      { emoji: "📱", count: 22, users: ["user-1"] },
      { emoji: "🕵️‍♂️", count: 18, users: ["user-2"] },
      { emoji: "😅", count: 15, users: ["user-3"] },
    ],
  },
  {
    id: "vibe-8",
    title: "The silence after telling a joke that nobody laughs at",
    description:
      "That excruciating moment when you deliver what you thought was a hilarious joke, but instead of laughter, you're met with awkward silence and blank stares.",
    image: null, // Using placeholder
    createdBy: users[3],
    createdAt: "2023-11-27T18:30:00Z",
    ratings: [
      {
        user: users[0],
        rating: 2,
        review: "The way you can physically feel your soul leaving your body in that moment is unmatched.",
        date: "2023-11-28T10:15:00Z",
      },
      {
        user: users[1],
        rating: 1,
        review: "The desperate need to explain the joke afterward only makes it worse. Trust me.",
        date: "2023-11-29T15:42:00Z",
      },
      {
        user: users[2],
        rating: 2,
        date: "2023-11-30T09:18:00Z",
      },
      {
        user: users[4],
        rating: 2,
        review: "I still have nightmares about jokes I told in 2012 that didn't land.",
        date: "2023-12-01T14:33:00Z",
      },
    ],
    tags: ["Embarrassing", "Social Anxiety", "Humor"],
    reactions: [
      { emoji: "🦗", count: 45, users: ["user-1", "user-2"] }, // Cricket sound
      { emoji: "😶", count: 29, users: ["user-3"] },
      { emoji: "💀", count: 17, users: ["user-4"] },
    ],
  },
]
