import { ClassGroupChatContent } from "../ClassGroupChat";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";

export const TeacherMessages = (): JSX.Element => {
    return (
        <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Tin nhắn" }]}>
            <ClassGroupChatContent mode="teacher" />
        </TeacherWorkspaceShell>
    );
};
