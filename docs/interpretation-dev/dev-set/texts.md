# The synthetic development set

> **Written by you.** These are the only texts a Track A run accepts. Results on them are AI-generated and exploratory, never reference annotations.
>
> **Rules:**
> - **Only synthetic texts.** Nothing from any person's session, and no real participant data.
> - **No existing text,** whether reused or adapted. That covers the corpus, the robustness set, the unseen cases, calibration, slice 1, the held-out set, the guide's examples and the test fixtures. The run script refuses any text that repeats one of them.
> - **Texts sent on the free tier are used by Google to improve its products.** Its pricing page says so (checked 2026-11-25).
>
> **Format:** the table below, with this exact header.
> - **Id:** `D` and three digits (D001 … D999), unique.
> - **Domain:** free words, for example "psychology".
> - **Text:** the text, on one line, with no `|` in it.
>
> A row with an empty Text is ignored.


| Id | Domain | Text |
| --- | --- | --- |
| D001 | psychology | During a drawing workshop, Alia handed Deniz a pencil. Deniz nodded and placed it beside the sketchbook without saying anything. |
| D002 | psychology | Rana invited a colleague to a group activity. No reply arrived by evening. Rana wondered whether the invitation had been overlooked or the colleague was simply busy. |
| D003 | education | When the paper tower collapsed during the experiment, the instructor said, "Well, that went perfectly." One student laughed, while another was unsure whether the instructor was serious. |
| D004 | community | A volunteer told the visitors that the garden gate would close at six, but the sign beside the entrance listed seven. Nobody had confirmed which time was correct. |
| D005 | planning | If the projector works tomorrow, the team will display its diagrams on the wall. Otherwise, they will distribute printed copies. The projector has not yet been tested. |
