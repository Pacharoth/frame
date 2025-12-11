document.addEventListener("DOMContentLoaded", () => {
  const guideBtn = document.getElementById("guideBtn");
  if (!guideBtn || !window.driver || !window.driver.js) return;

  guideBtn.addEventListener("click", () => {
    const driver = window.driver.js.driver;
    const tour = driver({
      showProgress: true,
      steps: [
        {
          element: '[data-tour="upload"]',
          popover: {
            title: "Upload your photo",
            description: "Click or drop an image to start. Square pictures look best.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: '[data-tour="frame"]',
          popover: {
            title: "Pick a frame",
            description: "Choose the campaign frame you want to overlay.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: '[data-tour="photo-controls"]',
          popover: {
            title: "Adjust the photo",
            description: "Zoom, rotate, blur, and drag the photo to fit perfectly.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="text-controls"]',
          popover: {
            title: "Add and style text",
            description: "Add captions, change fonts, colors, and rotate them.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="filters"]',
          popover: {
            title: "Filters",
            description: "Apply color moods to both the photo and frame.",
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="canvas"]',
          popover: {
            title: "Preview area",
            description: "Drag the photo or text directly here to position them.",
            side: "left",
            align: "center",
          },
        },
        {
          element: '[data-tour="preview"]',
          popover: {
            title: "Update preview",
            description: "Refresh the canvas after making changes.",
            side: "top",
            align: "center",
          },
        },
        {
          element: '[data-tour="download"]',
          popover: {
            title: "Download PNG",
            description: "Save the final image once you're happy with it.",
            side: "top",
            align: "center",
          },
        },
      ],
    });
    tour.drive();
  });
});
