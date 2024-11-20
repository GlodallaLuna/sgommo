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
    slidesWidth: int(percent) | array
    gap: px | string(percent)
    ..

    https://jsdoc.app/
*/

class Slide {
    #width = 100;
    #index = 0;
    #domRoot = null;
    #slideGap = 0;

    constructor(element, index, width, gap) {
        this.setWidth(width);
        this.setIndex(index);
        this.#domRoot = element;
        this.setGap(gap);
    }

    setIndex(index) {
        if (!isNaN(index)) this.#index = parseInt(index);
    }

    setWidth(width) {
        if (!isNaN(width)) this.#width = parseFloat(width);
    }

    setGap(gap) {
        this.#slideGap = gap;
    }

    getWidth() {
        return this.#width;
    }

    getDomRoot() {
        return this.#domRoot;
    }

    getPosition() {
        return this.#domRoot.getBoundingClientRect();
    }

    updateDomSlide() {
        this.#domRoot.style.width = this.#width + "px";
        this.#domRoot.style.marginRight = this.#slideGap + "px";
    }
}



class Sgommo {
    static DIRECTION = Object.freeze(
        {
            HORIZONTAL: 'horizontal',
            VERTICAL: 'vertical'
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
    #gap = 0;
    #domRoot = null;
    #domWrapper = null;
    #wrapperWidth = 0;
    #wrapperTransform = 0;
    #slidesWidth = [100];
    #slides = [];
    #debug = false;
    #isDragging = false;
    #startX = 0;
    #prevTranslate = 0;
    #currentTranslate = 0;
    #activeSlide = null;
    #lastSnap = {
        time: 0,
        oldTranslate: 0
    }

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
        this.setGap(params.gap);

        this.creator();
        this.updateDom();
        this.#addDragListeners();
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

    setGap(gap) {
        const regex = /%$/;
        if (!isNaN(gap)) this.#gap = parseFloat(gap);
        else if (typeof gap === "string" && regex.test(gap)) {
            this.#gap = this.percToVal(gap, this.#domRoot.offsetWidth);
        }
    }

    percToVal(perc, tot) {
        return tot * parseInt(perc.replace('%', '')) / 100;
    }

    #setDomRoot(root) {
        if (root !== null) this.#domRoot = root;
    }

    #setDomWrapper() {
        this.#domWrapper = this.#domRoot.querySelector(Sgommo.SELECTORS.WRAPPER);
    }

    #setActiveSlide() {
        let closestSlide = this.#slides[0];
        this.#slides.forEach((slide) => {
            /* se ho -1 e 1 ? rimane quella prima */
            if (Math.abs(slide.getPosition().x) < Math.abs(closestSlide.getPosition().x)) {
                closestSlide = slide;
            }
        });
        if (this.#activeSlide !== closestSlide) this.#activeSlide = closestSlide;
    }

    #setCurrentTranslate(val) {
        /* arrotondo a 3 cifre decimali */
        if (!isNaN(val)) this.#currentTranslate = Math.ceil(val * Math.pow(10, 3)) / Math.pow(10, 3);
    }

    #getDOMElement(el) {
        if (typeof el === 'string') {
            return document.querySelector(el);
        }
        return el
    }

    #getCurrentTranslate() {
        const style = window.getComputedStyle(this.#domWrapper);
        const matrix = new DOMMatrix(style.transform);
        return matrix.m41;
    }

    creator() {
        this.#createSlides();
        this.#setActiveSlide();
    }

    updateDom() {
        this.#slides.forEach((slide) => {
            slide.updateDomSlide();
        });
        this.updateDomWrapper();
        this.updateDomActiveSlide();
    }

    updateDomWrapper() {
        this.#domWrapper.setAttribute('style', `width: ${this.#wrapperWidth}px`);
    }

    updateDomActiveSlide() {
        if (this.#activeSlide != null) {
            this.#slides.forEach((slide) => {
                slide.getDomRoot().classList.remove('sgm-slide--active');
            });
            this.#activeSlide.getDomRoot().classList.add('sgm-slide--active');
        }
    }

    #createSlides() {
        let parentWidth = this.#domRoot.offsetWidth;
        /* fare setter e getter di this.#wrapperWidth */
        this.#wrapperWidth = 0;
        Array.from(this.#domWrapper.children).forEach((slide, index) => {
            let childWidthPercent = this.#slidesWidth[index % this.#slidesWidth.length];
            /* let currentSlideWidth = (parentWidth * childWidthPercent) / 100; */
            var slideWidth = 0;
            if (this.#slidesWidth.length === 1) { /* se mettono 50, 50 si rompe */
                slideWidth = (parentWidth - ((Math.round(100 / this.#slidesWidth) - 1) * this.#gap)) / Math.round(100 / this.#slidesWidth);
            } else {
                slideWidth = ((childWidthPercent * parentWidth) / 100) - ((childWidthPercent * (this.#gap * (this.#slidesWidth.length - 1)) / 100));
            }
            if (index === this.#domWrapper.children.length - 1) {
                this.#slides.push(new Slide(slide, index, slideWidth, 0));
            } else {
                this.#slides.push(new Slide(slide, index, slideWidth, this.#gap));
            }
            this.#wrapperWidth += slideWidth;
        });
        this.#wrapperWidth += this.#gap * (this.#slides.length - 1);
    }

    #ease(t) {
        const x1 = 0.25, y1 = 0.1, x2 = 0.25, y2 = 1;

        function cubicBezier(t, x1, y1, x2, y2) {
            const epsilon = 1e-5; // Precisione
            let t0 = 0, t1 = 1, tMid, xMid;

            while (t0 < t1) {
                tMid = (t0 + t1) / 2;
                xMid = (1 - tMid) ** 3 * 0 + 3 * (1 - tMid) ** 2 * tMid * x1 + 3 * (1 - tMid) * tMid ** 2 * x2 + tMid ** 3 * 1;

                if (Math.abs(xMid - t) < epsilon) break;
                if (xMid < t) t0 = tMid;
                else t1 = tMid;
            }

            const yMid = (1 - tMid) ** 3 * 0 + 3 * (1 - tMid) ** 2 * tMid * y1 + 3 * (1 - tMid) * tMid ** 2 * y2 + tMid ** 3 * 1;
            return yMid;
        }

        return cubicBezier(t, x1, y1, x2, y2);
    }

    #addDragListeners() {
        this.#domWrapper.addEventListener('mousedown', this.#startDrag.bind(this));
        window.addEventListener('mousemove', this.#drag.bind(this));
        window.addEventListener('mouseup', this.#endDrag.bind(this));
        /* da fare il touch */
    }

    #startDrag(event) {
        this.#isDragging = true;
        this.#startX = event.type === 'mousedown' ? event.clientX : event.touches[0].clientX;
        const deltaSnapTime = ((new Date).getTime() - this.#lastSnap.time);
        if (deltaSnapTime < this.#speed) {
            const progress = this.#ease(deltaSnapTime / this.#speed);
            this.#setCurrentTranslate(this.#lastSnap.oldTranslate + ((this.#currentTranslate - this.#lastSnap.oldTranslate) * progress));
            this.#setTranslate();
        }
        this.#prevTranslate = this.#currentTranslate;
    }

    #drag(event) {
        if (!this.#isDragging) return;
        this.#domWrapper.classList.add('sgm-moving');
        this.#domWrapper.style.transitionDuration = "0ms";
        const currentX = event.type === 'mousemove' ? event.clientX : event.touches[0].clientX;
        const deltaX = currentX - this.#startX;
        this.#setCurrentTranslate(this.#prevTranslate + deltaX);
        this.#setTranslate();
    }

    #endDrag() {
        if (!this.#isDragging) return;
        this.#isDragging = false;
        this.#setActiveSlide();
        this.updateDomActiveSlide();
        this.#domWrapper.classList.remove('sgm-moving');
        this.#lastSnap.oldTranslate = this.#getCurrentTranslate();
        if (this.#activeSlide.getPosition().x != 0) { /* problema perché qua ho valori tipo 0.00000007 ed entra dentro */
            console.log(this.#activeSlide.getPosition().x);
            this.slideSnap();
        }
    }

    #setTranslate() {
        this.#domWrapper.style.transform = `translateX(${this.#currentTranslate}px)`;
    }

    slideSnap() {
        if (this.#wrapperWidth + this.#currentTranslate > window.innerWidth) {
            this.#setCurrentTranslate(this.#currentTranslate - this.#activeSlide.getPosition().x);
        } else {
            this.#setCurrentTranslate((window.innerWidth - (this.#wrapperWidth + this.#currentTranslate)) + this.#currentTranslate);
        }
        this.#setTranslate();
        this.#domWrapper.style.transitionDuration = `${this.#speed}ms`;
        this.#lastSnap.time = (new Date).getTime();
        setTimeout(() => {
            this.#domWrapper.style.transitionDuration = "0ms";
        }, this.#speed);
    }

    log(msg) {
        if (this.#debug) console.log(msg);
    }
}