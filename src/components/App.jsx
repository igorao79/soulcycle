const switchTheme = () => {
  // Apply will-change before theme switch to optimize performance
  document.body.style.willChange = 'background-color, color';
  document.documentElement.style.transition = 'none';
  
  // Use requestAnimationFrame to batch changes in the next frame
  requestAnimationFrame(() => {
    // Toggle the theme
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Force a reflow
    void document.documentElement.offsetHeight;
    
    // Re-enable transitions after theme change is complete
    requestAnimationFrame(() => {
      document.documentElement.style.transition = '';
      document.body.style.willChange = '';
      
      // Dispatch theme change event
      window.dispatchEvent(new Event('themechange'));
    });
  });
}; 