class CarouselSlider extends HTMLElement {
	constructor() {
		super()
		this.slides = this.querySelectorAll('.slider__item')
		this.container = this.querySelector('.products-grid-container')
		this.content = this.querySelector('.slider__grid')
		this.scrollbar = this.querySelector('.scrollbar')
		this.thumb = this.querySelector('.thumb')
    this.showMoreBtn = this.querySelector(".show-more");
		this.isDragging = false
		this.startX
		this.scrollLeft

		if (this.slides.length < 2) return
		window.initLazyScript(this, this.init.bind(this))
	}

	init() {
		this.slider = this.querySelector('.slider')
		this.grid = this.querySelector('.slider__grid')
		this.rtl = document.dir === 'rtl'

		this.initSlider()
    this.updateScrollbar();
    this.hideProductsOnMobile()
    if (this.showMoreBtn) {
      this.showMoreBtn.addEventListener("click", () => this.toggleProducts());
    }
	}

	initSlider() {
		if (
			!(this.getAttribute('disable-mobile') && !window.matchMedia(window.theme.mediaQueries.sm).matches) &&
			!(this.getAttribute('disable-desktop') && window.matchMedia(window.theme.mediaQueries.sm).matches)
		) {
			this.gridWidth = this.grid.clientWidth

			// Distance between leading edges of adjacent slides (i.e. width of card + gap).
			this.slideSpan = this.getWindowOffset(this.slides[1]) - this.getWindowOffset(this.slides[0])

			// Width of gap between slides.
			this.slideGap = this.slideSpan - this.slides[0].clientWidth

			this.slidesPerPage = Math.round((this.gridWidth + this.slideGap) / this.slideSpan)
			this.slidesToScroll = this.slidesPerPage
			this.totalPages = this.slides.length - this.slidesPerPage + 1

			this.setCarouselState(this.totalPages > 1)
			if (this.totalPages < 2) return

			this.sliderStart = this.getWindowOffset(this.slider)
			if (!this.sliderStart) this.sliderStart = (this.slider.clientWidth - this.gridWidth) / 2
			this.sliderEnd = this.sliderStart + this.gridWidth

			if (window.matchMedia('(pointer: fine)').matches) {
				this.slider.classList.add('is-grabbable')
			}

			this.addListeners()
			this.setButtonStates()
		} else {
			this.setAttribute('inactive', '')
		}

		// Init the custom scrollbars
		if (!this.slider.classList.contains('slider--no-scrollbar') && window.OverlayScrollbarsGlobal) {
			window.OverlayScrollbarsGlobal.OverlayScrollbars(
				{
					target: this.slider.parentElement,
					elements: {
						viewport: this.slider,
					},
				},
				{}
			)
		}
	}

	addListeners() {
		this.thumb.addEventListener('mousedown', this.handleMouseDown)
		document.addEventListener('mousemove', this.handleMouseMove)
		document.addEventListener('mouseup', this.handleMouseUp)
    this.content.addEventListener('scroll', () => {
      const scrollPercentage = this.content.scrollLeft / (this.content.scrollWidth - this.container.offsetWidth);
      const thumbPosition = scrollPercentage * (this.scrollbar.offsetWidth - this.thumb.offsetWidth);
      this.thumb.style.left = `${thumbPosition}px`;
    }); 

    window.addEventListener('resize', this.updateScrollbar);
    window.addEventListener("resize", this.hideProductsOnMobile);

    this.container.addEventListener('wheel', (e) => {
      if (e.deltaX !== 0 || e.shiftKey) {
        e.preventDefault(); 
        this.content.scrollLeft += e.deltaX || e.deltaY;
        this.updateScrollbar();
      }
    }, { passive: false }); 
	}

	removeListeners() {
		this.slider.removeEventListener('mousedown', this.mousedownHandler)
		this.slider.removeEventListener('mouseup', this.mouseupHandler)
		this.slider.removeEventListener('mouseleave', this.mouseupHandler)
		this.slider.removeEventListener('mousemove', this.mousemoveHandler)
	}

	/**
	 * Gets the offset of an element from the edge of the viewport (left for ltr, right for rtl).
	 * @param {number} el - Element.
	 * @returns {number}
	 */
	getWindowOffset(el) {
		return this.rtl ? window.innerWidth - el.getBoundingClientRect().right : el.getBoundingClientRect().left
	}

	/**
	 * Gets the visible state of a slide.
	 * @param {Element} el - Slide element.
	 * @returns {boolean}
	 */
	getSlideVisibility(el) {
		const slideStart = this.getWindowOffset(el)
		const slideEnd = Math.floor(slideStart + this.slides[0].clientWidth)
		return slideStart >= this.sliderStart && slideEnd <= this.sliderEnd
	}

	/**
	 * Sets the active state of the carousel.
	 * @param {boolean} active - Set carousel as active.
	 */
	setCarouselState(active) {
		if (active) {
			this.removeAttribute('inactive')
		} else {
			this.setAttribute('inactive', '')
		}
	}

	/**
	 * Sets the disabled state of the nav buttons.
	 */
	setButtonStates() {
		if (!this.prevBtn && !this.nextBtn) {
			return
		}
		if (!this.mobilePrevBtn && !this.mobileNextBtn) {
			return
		}

		this.mobilePrevBtn.disabled = this.getSlideVisibility(this.slides[0]) && this.slider.scrollLeft === 0
		this.mobileNextBtn.disabled = this.getSlideVisibility(this.slides[this.slides.length - 1])
		this.prevBtn.disabled = this.getSlideVisibility(this.slides[0]) && this.slider.scrollLeft === 0
		this.nextBtn.disabled = this.getSlideVisibility(this.slides[this.slides.length - 1])
	}

	// scrollbar:
	updateScrollbar = () => {
		const contentWidth = this.content.scrollWidth
		const containerWidth = this.container.offsetWidth

		const scrollbarWidth = containerWidth * (containerWidth / contentWidth)

		this.thumb.style.width = `${scrollbarWidth}px`

		const scrollPercentage = this.content.scrollLeft / (this.content.scrollWidth - this.container.offsetWidth)
		const thumbPosition = scrollPercentage * (this.scrollbar.offsetWidth - this.thumb.offsetWidth)
		this.thumb.style.left = `${thumbPosition}px`
	}

	handleMouseDown = (e) => {
		this.isDragging = true
		this.startX = e.pageX - this.thumb.offsetLeft
		this.scrollLeft = this.content.scrollLeft
	}

	handleMouseMove = (e) => {
		if (!this.isDragging) return
		const x = e.pageX - this.startX
		const scrollPercentage = x / (this.scrollbar.offsetWidth - this.thumb.offsetWidth)
		this.content.scrollLeft = scrollPercentage * (this.content.scrollWidth - this.container.offsetWidth)
	}

	handleMouseUp = () => {
		this.isDragging = false
	}

  hideProductsOnMobile = () => {
    if (!this.slides) return;
  
    const isMobile = window.outerWidth <= 767;
  
    if (isMobile) {
      this.isExpanded = false;
      this.showMoreBtn.textContent = "Show More";
  
      this.slides.forEach((slide, index) => {
        if (index >= 4) slide.classList.add("remove");
      });
    } else {
      this.slides.forEach(slide => slide.classList.remove("remove"));
    }
  }

  toggleProducts() {
    if (!this.slides) return;
  
    this.isExpanded = !this.isExpanded;
    this.slides.forEach((slide, index) => {
      if (index >= 4) slide.classList.toggle("remove", !this.isExpanded);
    });
  
    this.showMoreBtn.textContent = this.isExpanded ? "Show Less" : "Show More";
  }
}

customElements.define('carousel-slider', CarouselSlider)
