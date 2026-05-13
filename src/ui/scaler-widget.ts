export interface ScalerWidgetOptions {
  baseServings: number;
  onChange: (value: number) => void;
}

export function createScalerWidget(opts: ScalerWidgetOptions): HTMLElement {
  const wrap = document.createElement("span");
  wrap.className = "recipe-scaler-widget";

  const icon = document.createElement("span");
  icon.className = "recipe-scaler-icon";
  icon.textContent = "🍽";
  wrap.appendChild(icon);

  const label = document.createElement("span");
  label.className = "recipe-scaler-label";
  label.textContent = "Servings:";
  wrap.appendChild(label);

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.value = String(opts.baseServings);
  input.className = "recipe-scaler-input";
  input.addEventListener("change", () => {
    let v = parseInt(input.value, 10);
    if (!Number.isFinite(v) || v < 1) v = 1;
    input.value = String(v);
    opts.onChange(v);
  });

  const minus = document.createElement("button");
  minus.type = "button";
  minus.className = "recipe-scaler-step recipe-scaler-step-down";
  minus.textContent = "−"; // U+2212 MINUS SIGN
  minus.title = "Decrease";
  minus.addEventListener("click", () => {
    const current = parseInt(input.value, 10);
    const next = Math.max(1, (Number.isFinite(current) ? current : 1) - 1);
    input.value = String(next);
    input.dispatchEvent(new Event("change"));
  });
  wrap.appendChild(minus);

  wrap.appendChild(input);

  const plus = document.createElement("button");
  plus.type = "button";
  plus.className = "recipe-scaler-step recipe-scaler-step-up";
  plus.textContent = "+";
  plus.title = "Increase";
  plus.addEventListener("click", () => {
    const current = parseInt(input.value, 10);
    const next = (Number.isFinite(current) ? current : 0) + 1;
    input.value = String(next);
    input.dispatchEvent(new Event("change"));
  });
  wrap.appendChild(plus);

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "recipe-scaler-reset";
  reset.textContent = "↺";
  reset.title = `Reset to ${opts.baseServings}`;
  reset.addEventListener("click", () => {
    input.value = String(opts.baseServings);
    input.dispatchEvent(new Event("change"));
  });
  wrap.appendChild(reset);

  const base = document.createElement("span");
  base.className = "recipe-scaler-base";
  base.textContent = String(opts.baseServings);
  wrap.appendChild(base);

  return wrap;
}
