!function (e) { var i, n; "function" == typeof define && define.amd ? define(["jquery", "datatables.net"], function (t) { return e(t, window, document) }) : "object" == typeof exports ? (i = require("jquery"), n = function (t, a) { a.fn.dataTable || require("datatables.net")(t, a) }, "undefined" == typeof window ? module.exports = function (t, a) { return t = t || window, a = a || i(t), n(t, a), e(a, 0, t.document) } : (n(window, i), module.exports = e(i, window, window.document))) : e(jQuery, window, document) }(function (t, a, n) { "use strict"; var g = t.fn.dataTable; function o(t, a, e) { t.classList.toggle(a, e); a = t.querySelector("a"); a && (e ? a.setAttribute("disabled", "disabled") : a.removeAttribute("disabled")) } function c(t, a, e) { var i = n.createElement(t.tag); return i.className = t.className, t.liner && t.liner.tag ? (t = c(t.liner, a), i.appendChild(t)) : a && (i.textContent = a), e && i.addEventListener("click", e), i } return g.feature.register("inputPaging", function (t, a) { let e = new g.Api(t), i = function (t) { t = t.table().container(), t = t.classList; { if (t.contains("dt-bootstrap5") || t.contains("dt-bootstrap4") || t.contains("dt-bootstrap")) return { wrapper: { tag: "ul", className: "dt-inputpaging pagination" }, item: { tag: "li", className: "page-item", disabled: "disabled", liner: { tag: "a", className: "page-link" } }, inputItem: { tag: "li", className: "page-item dt-paging-input" }, input: { tag: "input", className: "" } }; if (t.contains("dt-bulma")) return { wrapper: { tag: "ul", className: "dt-inputpaging pagination-list" }, item: { tag: "li", className: "", disabled: "disabled", liner: { tag: "a", className: "pagination-link" } }, inputItem: { tag: "li", className: "dt-paging-input" }, input: { tag: "input", className: "" } }; if (t.contains("dt-foundation")) return { wrapper: { tag: "ul", className: "dt-inputpaging pagination" }, item: { tag: "li", className: "", disabled: "disabled", liner: { tag: "a", className: "" } }, inputItem: { tag: "li", className: "dt-paging-input" }, input: { tag: "input", className: "" } }; if (t.contains("dt-semanticUI")) return { wrapper: { tag: "div", className: "dt-inputpaging ui unstackable pagination menu" }, item: { tag: "a", className: "page-link item", disabled: "disabled" }, inputItem: { tag: "div", className: "dt-paging-input" }, input: { tag: "input", className: "ui input" } } } return { wrapper: { tag: "div", className: "dt-inputpaging dt-paging" }, item: { tag: "button", className: "dt-paging-button", disabled: "disabled" }, inputItem: { tag: "div", className: "dt-paging-input", liner: { tag: "", className: "" } }, input: { tag: "input", className: "" } } }(e); t = Object.assign({ firstLast: !0, previousNext: !0, pageOf: !0 }, a), a = c(i.wrapper); let n = c(i.item, e.i18n("oPaginate.sFirst", "�"), () => e.page("first").draw(!1)), s = c(i.item, e.i18n("oPaginate.sPrevious", "�"), () => e.page("previous").draw(!1)), p = c(i.item, e.i18n("oPaginate.sNext", "�"), () => e.page("next").draw(!1)), d = c(i.item, e.i18n("oPaginate.sLast", "�"), () => e.page("last").draw(!1)); var l = c(i.inputItem); let r = c(i.input), u = c({ tag: "span", className: "" }); return r.setAttribute("type", "text"), r.setAttribute("inputmode", "numeric"), r.setAttribute("pattern", "[0-9]*"), t.firstLast && a.appendChild(n), t.previousNext && a.appendChild(s), a.appendChild(l), t.previousNext && a.appendChild(p), t.firstLast && a.appendChild(d), l.appendChild(r), t.pageOf && l.appendChild(u), r.addEventListener("keypress", function (t) { (t.charCode < 48 || 57 < t.charCode) && t.preventDefault() }), r.addEventListener("input", function () { r.value && e.page(r.value - 1).draw(!1), r.style.width = r.value.length + 2 + "ch" }), e.on("draw", () => { var t = e.page.info(); o(n, i.item.disabled, 0 === t.page), o(s, i.item.disabled, 0 === t.page), o(p, i.item.disabled, t.page === t.pages - 1), o(d, i.item.disabled, t.page === t.pages - 1), r.value !== t.page + 1 && (r.value = t.page + 1), u.textContent = " / " + t.pages }), a }), g });