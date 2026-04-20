import { api } from "./clients";
import { endpoints } from "./endpoints";
import type { ClassGroupDetailDto, TeacherClassesOverviewDto } from "./schools";

export async function getTeacherClassesOverview(): Promise<TeacherClassesOverviewDto> {
    return api<TeacherClassesOverviewDto>(endpoints.teacher.classes, {
        method: "GET",
        auth: true,
    });
}

export async function getTeacherClassDetail(id: string): Promise<ClassGroupDetailDto> {
    return api<ClassGroupDetailDto>(`${endpoints.teacher.classes}/${id}`, {
        method: "GET",
        auth: true,
    });
}
