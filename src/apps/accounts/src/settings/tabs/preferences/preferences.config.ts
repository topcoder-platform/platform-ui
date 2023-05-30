/* eslint-disable max-len */
export const newsletters: Array<{ id: string, name: string, desc: string }> = [
    {
        desc: 'This newsletter gets sent out at various times, specifically when we have an opportunity of mass appeal. For more information you can visit the <a href="https://www.topcoder.com/community/taas" style="color:#0d61bf;text-decoration:none;font-weight:500;">Gig Work page.</a>',
        id: 'd0c48e9da3',
        name: 'Gig Work',
    },
    {
        desc: 'This newsletter gets sent out at the end of every month and contains a variety of important information across all of our tracks.',
        id: 'a8f858cdf1',
        name: 'Monthly Newsletter',
    },
    {
        desc: 'Receive updates whenever a new marathon match is scheduled.',
        id: '5e67dba327',
        name: 'Marathon Match Reminders',
    },
    {
        desc: 'Attention Competitive Programmers! If there is any newsletter you are subscribing too, it better be this one. Receive updates when a new SRM event is scheduled.',
        id: '9091b438cc',
        name: 'Single Round Match (SRM) Reminders',
    },
    {
        desc: 'Receive notifications of our brand new RDMs! These rated, development matches will be a fun new way to engage with us!',
        id: '3460574ddd',
        name: 'Rapid Development Match (RDM) Reminders',
    },
]

export const programs: Array<{ id: string, name: string, desc: string }> = [
    {
        desc: 'If you have applied and been approved as a <a href="https://www.topcoder.com/community/member-programs/beta-testers" style="color:#0d61bf;text-decoration:none;font-weight:500;">Beta Tester</a>, you may control the emails you receive here.',
        id: 'cafe98d7a7',
        name: 'Beta Testers',
    },
]

export const unsubscribeLink: string = 'https://topcoder.us13.list-manage.com/unsubscribe?u=65bd5a1857b73643aad556093&id=28bfd3c062'
export const subscribeLink: string = 'https://topcoder.us13.list-manage.com/subscribe/post?u=65bd5a1857b73643aad556093&id=28bfd3c062'
