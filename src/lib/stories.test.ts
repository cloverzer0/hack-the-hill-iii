import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET as getDepartments } from "@/app/api/departments/route";
import { GET as getSpendingStory } from "@/app/api/spending/[id]/route";
import { GET as getSpending } from "@/app/api/spending/route";
import dataStories from "../../pipeline/stories.json";
import newsStories from "../../pipeline/news_stories.json";
import { getStory, listDepartments, listStories, type Story } from "./stories";

describe("stories", () => {
  it("lists the pipeline stories", async () => {
    const stories = await listStories();
    expect(stories.length).toBeGreaterThan(0);
    expect(stories[0]).toEqual(
      expect.objectContaining({ id: expect.any(String), title: expect.any(String) }),
    );
  });

  it("finds a story by id", async () => {
    const [first] = await listStories();
    expect(await getStory(first.id)).toEqual(first);
  });

  it("returns null for an unknown id", async () => {
    expect(await getStory("no-such-story")).toBeNull();
  });

  it("includes both the data stories and the news stories, newest first", async () => {
    const stories = await listStories();
    expect(stories).toHaveLength(dataStories.length + newsStories.length);
    expect(new Set(stories.map((story) => story.source_type))).toEqual(new Set(["data", "news"]));
    const dates = stories.map((story) => story.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("filters by department code, in any case", async () => {
    const [first] = await listStories();
    const onlyThat = await listStories({ department: first.dept_code.toLowerCase() });
    expect(onlyThat.length).toBeGreaterThan(0);
    expect(onlyThat.every((story) => story.dept_code === first.dept_code)).toBe(true);
    expect(await listStories({ department: "NOPE" })).toEqual([]);
  });
});

describe("listDepartments", () => {
  it("counts every story once, most stories first", async () => {
    const departments = await listDepartments();
    expect(departments.reduce((sum, department) => sum + department.count, 0)).toBe((await listStories()).length);
    expect(new Set(departments.map((department) => department.dept_code)).size).toBe(departments.length);
    const counts = departments.map((department) => department.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });
});

describe("GET /api/spending", () => {
  const get = (query = "") => getSpending(new NextRequest(`http://localhost/api/spending${query}`));

  it("returns the whole feed without a filter", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength((await listStories()).length);
  });

  it("returns one department's stories", async () => {
    const [department] = await listDepartments();
    const stories: Story[] = await (await get(`?department=${department.dept_code}`)).json();
    expect(stories).toHaveLength(department.count);
  });

  it("rejects a department that isn't a code", async () => {
    const res = await get("?department=drop%20table");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_department" });
  });
});

describe("GET /api/spending/:id", () => {
  const get = (id: string) => getSpendingStory(new Request(`http://localhost/api/spending/${id}`), { params: Promise.resolve({ id }) });

  it("returns the story", async () => {
    const [first] = await listStories();
    const res = await get(first.id);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(first);
  });

  it("404s for an unknown id", async () => {
    const res = await get("no-such-story");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });
});

describe("GET /api/departments", () => {
  it("returns the filter chips", async () => {
    const res = await getDepartments();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(await listDepartments());
  });
});
