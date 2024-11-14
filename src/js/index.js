/*
    caricamento al load;
    speed: ms;
    direction: horizontal, vertical;
    loop: boolean;
    centered: boolean;
    autoplay: ms (default false, default disable interaction true);
    prevEl: HTMLelement | selector;
    nextEl: HTMLelement | selector;
    pagination: obj(el: HTMLelement | selector, type: string('bullets' | 'fraction' | 'progressBar?'));
    effect: string('slide' | 'fade' | 'cards');
    spaceBetween: px | percent;
    slidesWidth: int(percent) | array
    ..
*/

class Slide {
    #width = 100;
    #index = 0;
    #domRoot = null;

    constructor(element, index, width) {
        this.setWidth(width);
        this.setIndex(index);
        this.#domRoot = element;
    }

    setIndex(index) {
        if (!isNaN(index)) this.#index = parseInt(index);
    }

    setWidth(width) {
        if (!isNaN(width)) this.#width = parseFloat(width);
    }

    getWidth() {
        return this.#width;
    }

    updateDomSlide() {
        this.#domRoot.setAttribute('style', `width: ${this.#width}px`);
    }
}



class Sgommo {
    static DIRECTION = Object.freeze(
        { 
            HORIZONTAL : 'horizontal', 
            VERTICAL :  'vertical'
        }
    );
    static SELECTORS = Object.freeze(
        { 
            WRAPPER: '.sgm-wrapper',
            SLIDE: '.sgm-slide'
        }
    )
    #speed = 1000;
    #direction = null;
    #loop = true;
    #autoplay = false;
    #domRoot = null;
    #domWrapper = null;
    #wrapperWidth = 0;
    #wrapperTransform = 0;
    #slidesWidth = [100];
    #slides = [];
    #debug = false;
    
    constructor(el, params) {
        this.#setDomRoot(this.#getDOMElement(el));
        this.#setDomWrapper();
        if (this.#domWrapper === null) {
            this.log("missing .sgm-wrapper");
            return;
        }
        this.setDirection(params.direction);
        this.setSpeed(params.speed);
        this.setLoop(params.loop);
        this.setAutoplay(params.autoplay);
        this.setSlidesWidth(params.slidesWidth);
        
        this.creator();
        this.updateDom();
    }
    
    setSpeed(speed) {
        if (!isNaN(speed)) this.#speed = parseInt(speed);
    }

    setDirection(direction) {
        this.#direction = Object.values(Sgommo.DIRECTION).includes(direction) ? direction : Sgommo.DIRECTION.HORIZONTAL;
    }

    setSlidesWidth(slidesWidthRaw) {
        slidesWidthRaw = Array.isArray(slidesWidthRaw) ? slidesWidthRaw : [slidesWidthRaw];
        if (slidesWidthRaw.length > 0) this.#slidesWidth = slidesWidthRaw.filter(el => !Number.isNaN(Number(el)));
    }

    setLoop(loop) {
        if (typeof loop == "boolean") this.#loop = loop;
    }

    setAutoplay(autoplay) {
        if (!isNaN(autoplay)) this.#autoplay = parseInt(autoplay);
    }

    #setDomRoot(root) {
        if (root !== null) this.#domRoot = root;
    }

    #setDomWrapper() {
        this.#domWrapper = this.#domRoot.querySelector(Sgommo.SELECTORS.WRAPPER);
    }


    #getDOMElement(el) {
        if(typeof el === 'string') {
            return document.querySelector(el);
        }
        return el
    }

    creator() {
        this.#createSlides();    
    }

    updateDom() {
        this.#slides.forEach((slide) => {
            slide.updateDomSlide();
        });
        this.updateDomWrapper();
    }

    updateDomWrapper() {
        this.#domWrapper.setAttribute('style', `width: ${this.#wrapperWidth}px`)
    }

    #createSlides() {
        let parentWidth = this.#domRoot.offsetWidth;
        this.#wrapperWidth = 0;
        Array.from(this.#domWrapper.children).forEach((slide, index) => {
            let childWidthPercent = this.#slidesWidth[index % this.#slidesWidth.length];    
            let currentSlideWidth = (parentWidth * childWidthPercent) / 100;
            this.#wrapperWidth += currentSlideWidth;
            /* fare setter e getter di this.#wrapperWidth */
            this.#slides.push(new Slide(slide, index, currentSlideWidth));
        });
    }

    log(msg) {
        if (this.#debug) console.log(msg);
    }

}