const STORAGE_KEY = "sayu-reflections";
const prompts = [
  "요즘 내 마음속에 오래 머무는 질문은 무엇인가요?",
  "최근에 당연하다고 여겼지만 다시 생각해보고 싶은 것은 무엇인가요?",
  "내가 진짜 중요하게 여기는 가치는 어떤 순간에 드러나나요?",
  "지금의 나에게 조금 더 너그러워진다면 어떤 말을 건네고 싶나요?",
  "아직 답을 몰라도 괜찮다면, 어떤 질문을 품고 지내고 싶나요?",
];

const form = document.querySelector("#reflection-form");
const titleInput = document.querySelector("#reflection-title");
const bodyInput = document.querySelector("#reflection-body");
const countLabel = document.querySelector("#character-count");
const message = document.querySelector("#form-message");
const entriesList = document.querySelector("#entries-list");
const entryCount = document.querySelector("#entry-count");
const searchInput = document.querySelector("#search-input");
const promptText = document.querySelector("#prompt-text");
const dateLabel = document.querySelector("#today-date");

let reflections = loadReflections();
let promptIndex = 0;

dateLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date());

function loadReflections() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            typeof item.body === "string" &&
            typeof item.createdAt === "string",
        )
      : [];
  } catch (error) {
    console.error("저장한 생각을 불러오지 못했습니다.", error);
    showMessage("저장한 생각을 불러오지 못했어요. 브라우저 저장 공간을 확인해주세요.", true);
    return [];
  }
}

function saveReflections() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
    return true;
  } catch (error) {
    console.error("생각을 저장하지 못했습니다.", error);
    showMessage("저장에 실패했어요. 브라우저 저장 공간을 확인해주세요.", true);
    return false;
  }
}

function showMessage(text, isError = false) {
  message.textContent = text;
  if (isError) {
    message.dataset.error = "true";
  } else {
    delete message.dataset.error;
  }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "날짜 없음";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function makeEntryCard(reflection) {
  const card = document.createElement("article");
  card.className = "entry-card";

  const title = document.createElement("h3");
  title.textContent = reflection.title;

  const preview = document.createElement("p");
  preview.textContent = reflection.body;

  const footer = document.createElement("footer");
  const date = document.createElement("time");
  date.dateTime = reflection.createdAt;
  date.textContent = formatDate(reflection.createdAt);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "삭제";
  deleteButton.setAttribute("aria-label", `${reflection.title} 기록 삭제`);
  deleteButton.addEventListener("click", () => {
    const previous = reflections;
    reflections = reflections.filter((item) => item.id !== reflection.id);
    if (saveReflections()) {
      renderReflections();
      showMessage("생각을 삭제했어요.");
    } else {
      reflections = previous;
    }
  });

  footer.append(date, deleteButton);
  card.append(title, preview, footer);
  return card;
}

function renderReflections() {
  const query = searchInput.value.trim().toLocaleLowerCase("ko");
  const visibleReflections = reflections.filter((reflection) =>
    `${reflection.title} ${reflection.body}`.toLocaleLowerCase("ko").includes(query),
  );

  entryCount.textContent = String(reflections.length);
  entriesList.replaceChildren();

  if (visibleReflections.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = query
      ? "검색한 내용이 없어요. 다른 단어로 찾아보세요."
      : "아직 모아둔 생각이 없어요. 첫 번째 생각을 적어볼까요?";
    entriesList.append(emptyState);
    return;
  }

  visibleReflections
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .forEach((reflection) => entriesList.append(makeEntryCard(reflection)));
}

bodyInput.addEventListener("input", () => {
  countLabel.textContent = `${bodyInput.value.length} / 5000`;
});

searchInput.addEventListener("input", renderReflections);

document.querySelector("#next-prompt").addEventListener("click", () => {
  promptIndex = (promptIndex + 1) % prompts.length;
  promptText.textContent = prompts[promptIndex];
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const body = bodyInput.value.trim();

  if (!body) {
    showMessage("생각을 한 줄이라도 적어주세요.", true);
    bodyInput.focus();
    return;
  }

  const reflection = {
    id: crypto.randomUUID(),
    title: titleInput.value.trim() || body.split(/\s+/).slice(0, 6).join(" "),
    body,
    createdAt: new Date().toISOString(),
  };

  reflections.unshift(reflection);
  if (!saveReflections()) {
    reflections.shift();
    return;
  }

  form.reset();
  countLabel.textContent = "0 / 5000";
  renderReflections();
  showMessage("생각을 이 기기에 저장했어요.");
});

renderReflections();
