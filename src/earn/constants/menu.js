/* --- MENU --- */
export const NAV_MENU = {
    children: [
      {
        name: "My Work",
        icon: "my-work.svg",
        iconActive: "my-work-green.svg",
        auth: true,
        children: [
          {
            name: "My Gigs",
            path: "/earn/my-gigs",
          },
        ],
      },
      {
        name: "Find Work",
        icon: "find-work.svg",
        iconActive: "find-work-green.svg",
        children: [
          {
            name: "Gigs",
            path: "/earn/gigs",
          },
          {
            name: "Challenges",
            path: "/earn/find/challenges",
          },
        ],
      },
    ],
  };
  