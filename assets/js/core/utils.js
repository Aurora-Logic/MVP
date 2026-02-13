// ════════════════════════════════════════
// UTILS — DatePicker + helpers
// ════════════════════════════════════════

/* exported autoResizeTextarea, initDatePickers, sanitizeHtml */

// SECURITY FIX: Global HTML sanitization using DOMPurify
function sanitizeHtml(dirty) {
    if (!dirty || typeof dirty !== 'string') return '';
    if (typeof DOMPurify === 'undefined') {
        console.warn('[Security] DOMPurify not loaded, using basic escaping');
        return esc(dirty);
    }
    // Strict config: only allow safe HTML tags
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
        ALLOW_DATA_ATTR: false
    });
}

class DatePicker {
    constructor(input) {
        this.input = input;
        const initialValue = input.dataset.value;
        this.selectedDate = initialValue ? new Date(initialValue) : null;
        this.viewDate = this.selectedDate ? new Date(this.selectedDate) : new Date();
        this.maxDate = input.dataset.maxDate || null;
        this.isOpen = false;
        this.init();
    }

    init() {
        const wrap = document.createElement('div');
        wrap.className = 'date-input-wrap';
        this.input.parentNode.insertBefore(wrap, this.input);
        wrap.appendChild(this.input);
        this.input.type = 'text';
        this.input.readOnly = true;
        this.input.value = this.formatDisplay(this.selectedDate);
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'calendar');
        icon.className = 'date-trigger';
        icon.style.cssText = 'width:16px;height:16px';
        wrap.appendChild(icon);
        this.picker = document.createElement('div');
        this.picker.className = 'date-picker';
        wrap.appendChild(this.picker);
        this.input.addEventListener('click', () => this.toggle());
        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) this.close();
        });
        lucide.createIcons();
    }

    toggle() { this.isOpen ? this.close() : this.open(); }
    open() { this.isOpen = true; this.render(); this.picker.classList.add('open'); }
    close() { this.isOpen = false; this.picker.classList.remove('open'); }

    render() {
        const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentYear = today.getFullYear();

        const monthItems = monthsFull.map((m, i) => ({ value: String(i), label: m }));
        const yearItems = [];
        for (let y = currentYear - 10; y <= currentYear + 10; y++) yearItems.push({ value: String(y), label: String(y) });

        let html = `
            <div class="dp-header">
                <div class="dp-selects">
                    <div class="dp-month-wrap"></div>
                    <div class="dp-year-wrap"></div>
                </div>
                <div class="dp-nav">
                    <button type="button" onclick="event.stopPropagation();datePickers['${this.input.id}'].prevMonth()"><i data-lucide="chevron-left"></i></button>
                    <button type="button" onclick="event.stopPropagation();datePickers['${this.input.id}'].nextMonth()"><i data-lucide="chevron-right"></i></button>
                </div>
            </div>
            <div class="dp-weekdays">${weekdays.map(d => `<div class="dp-weekday">${d}</div>`).join('')}</div>
            <div class="dp-days">`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        for (let i = firstDay - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i;
            html += `<button type="button" class="dp-day other" onclick="datePickers['${this.input.id}'].select(${year}, ${month - 1}, ${d})">${d}</button>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            date.setHours(0, 0, 0, 0);
            const isToday = date.getTime() === today.getTime();
            const isSelected = this.selectedDate && date.getTime() === this.selectedDate.getTime();
            const classes = ['dp-day'];
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            let dayDisabled = false;
            if (this.maxDate) { const mx = new Date(this.maxDate); mx.setHours(0,0,0,0); if (date > mx) { classes.push('disabled'); dayDisabled = true; } }
            html += `<button type="button" class="${classes.join(' ')}"${dayDisabled ? ' disabled' : ''} onclick="datePickers['${this.input.id}'].select(${year}, ${month}, ${d})">${d}</button>`;
        }
        const totalCells = firstDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let d = 1; d <= remaining; d++) {
            html += `<button type="button" class="dp-day other" onclick="datePickers['${this.input.id}'].select(${year}, ${month + 1}, ${d})">${d}</button>`;
        }

        html += `</div>
            <div class="dp-footer">
                <button type="button" class="dp-clear-btn" onclick="event.stopPropagation();datePickers['${this.input.id}'].clear()">Clear</button>
                <button type="button" class="dp-today-btn" onclick="event.stopPropagation();datePickers['${this.input.id}'].setToday()">Today</button>
            </div>`;
        this.picker.innerHTML = html;
        const self = this;
        const mw = this.picker.querySelector('.dp-month-wrap');
        const yw = this.picker.querySelector('.dp-year-wrap');
        if (typeof csel === 'function') {
            if (mw) csel(mw, { value: String(month), small: true, items: monthItems, onChange: v => self.setMonth(v) });
            if (yw) csel(yw, { value: String(year), small: true, items: yearItems, onChange: v => self.setYear(v) });
        }
        lucide.createIcons();
    }

    prevMonth() { this.viewDate.setMonth(this.viewDate.getMonth() - 1); this.render(); }
    nextMonth() { this.viewDate.setMonth(this.viewDate.getMonth() + 1); this.render(); }
    setMonth(month) { this.viewDate.setMonth(parseInt(month)); this.render(); }
    setYear(year) { this.viewDate.setFullYear(parseInt(year)); this.render(); }

    select(year, month, day) {
        const d = new Date(year, month, day);
        d.setHours(0, 0, 0, 0);
        if (this.maxDate) {
            const max = new Date(this.maxDate); max.setHours(0, 0, 0, 0);
            if (d > max) return;
        }
        this.selectedDate = d;
        this.viewDate = new Date(this.selectedDate);
        this.input.value = this.formatDisplay(this.selectedDate);
        this.input.dataset.value = this.formatISO(this.selectedDate);
        this.close();
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    setToday() {
        const today = new Date();
        this.select(today.getFullYear(), today.getMonth(), today.getDate());
    }

    clear() {
        this.selectedDate = null;
        this.input.value = '';
        this.input.dataset.value = '';
        this.close();
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    formatDisplay(date) {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    formatISO(date) {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }
}

const datePickers = {};

function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function initDatePickers() {
    document.querySelectorAll('input[data-datepicker]').forEach(input => {
        const isWrapped = input.parentElement?.classList?.contains('date-input-wrap');
        if (!isWrapped) {
            datePickers[input.id] = new DatePicker(input);
        }
    });
}
