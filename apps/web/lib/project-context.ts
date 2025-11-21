import {redirect} from 'next/navigation';
import {prisma} from '@/lib/prisma';

export type ProjectContext = {
    project: {id: number; name: string; ownerId: string};
    projectId: number;
};

export async function getActiveProjectForUser(userId: string, searchParamsProject?: string
    ): Promise<ProjectContext> {
    let project;

    if (searchParamsProject) {
        const projectId = parseInt(searchParamsProject, 10);
        if (Number.isNaN(projectId)){
            redirect('/app');
        }

        project = await prisma.project.findUnique({
            where: {id: projectId}, 
            select: {id:true,name:true,ownerId:true}
        });

        if (!project || project.ownerId !== userId) {
            redirect('/app');
        }
        return {project, projectId: project.id};
    }

    // Fallback: fist owned project
    project = await prisma.project.findFirst({
        where: {ownerId: userId}, 
        select: {id:true,name:true,ownerId:true},
    });

    if (!project) {
        redirect('/app');
    }
    return {project, projectId: project.id};
}