// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><a href="preface.html"><strong aria-hidden="true">1.</strong> 이 가이드를 읽는 법</a></li><li class="chapter-item expanded affix "><li class="part-title">제1부: 시뮬레이터의 경계</li><li class="chapter-item expanded "><a href="part1/ch01-overview.html"><strong aria-hidden="true">2.</strong> 1장: TinyTroupe는 무엇인가</a></li><li class="chapter-item expanded "><a href="part1/ch02-run-path.html"><strong aria-hidden="true">3.</strong> 2장: 한 번의 시뮬레이션이 지나가는 길</a></li><li class="chapter-item expanded "><a href="part1/ch03-tiny-person.html"><strong aria-hidden="true">4.</strong> 3장: TinyPerson과 행동 문법</a></li><li class="chapter-item expanded affix "><li class="part-title">제2부: 세계와 기억</li><li class="chapter-item expanded "><a href="part2/ch04-tiny-world.html"><strong aria-hidden="true">5.</strong> 4장: TinyWorld와 관계 네트워크</a></li><li class="chapter-item expanded "><a href="part2/ch05-memory-grounding.html"><strong aria-hidden="true">6.</strong> 5장: episodic·semantic memory와 grounding</a></li><li class="chapter-item expanded "><a href="part2/ch06-factory.html"><strong aria-hidden="true">7.</strong> 6장: persona factory와 표본 설계</a></li><li class="chapter-item expanded affix "><li class="part-title">제3부: 결과를 지식으로 바꾸기</li><li class="chapter-item expanded "><a href="part3/ch07-extraction.html"><strong aria-hidden="true">8.</strong> 7장: 추출, 축약, 보고서와 artifact</a></li><li class="chapter-item expanded "><a href="part3/ch08-steering.html"><strong aria-hidden="true">9.</strong> 8장: proposition, intervention과 story</a></li><li class="chapter-item expanded "><a href="part3/ch09-validation.html"><strong aria-hidden="true">10.</strong> 9장: 실험과 경험 자료 검증</a></li><li class="chapter-item expanded affix "><li class="part-title">제4부: 실행을 다시 다루기</li><li class="chapter-item expanded "><a href="part4/ch10-control.html"><strong aria-hidden="true">11.</strong> 10장: transaction cache, checkpoint와 재현</a></li><li class="chapter-item expanded "><a href="part4/ch11-runtime.html"><strong aria-hidden="true">12.</strong> 11장: 모델, 비용과 실행 표면</a></li><li class="chapter-item expanded affix "><li class="part-title">제5부: 정직하게 사용하기</li><li class="chapter-item expanded "><a href="part5/ch12-boundaries.html"><strong aria-hidden="true">13.</strong> 12장: 무엇을 증명하고 무엇을 증명하지 못하는가</a></li><li class="chapter-item expanded "><a href="source-map.html"><strong aria-hidden="true">14.</strong> 소스 지도와 출처</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0].split("?")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
