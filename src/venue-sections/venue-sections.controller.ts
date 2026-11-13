import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { CreateVenueSectionDto } from './dto/create-venue-section.dto';
import { UpdateVenueSectionDto } from './dto/update-venue-section.dto';
import { VenueSectionsService } from './venue-sections.service';

@Controller()
export class VenueSectionsController {
  constructor(private readonly sectionsService: VenueSectionsService) {}

  @Post('venue-sections')
  create(@Body() dto: CreateVenueSectionDto) {
    return this.sectionsService.create(dto);
  }

  @Get('venues/:venueId/sections')
  findByVenue(@Param('venueId', ParseIntPipe) venueId: number) {
    return this.sectionsService.findByVenue(venueId);
  }

  @Patch('venue-sections/:id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.sectionsService.updateStatus(id, dto);
  }

  @Patch('venue-sections/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVenueSectionDto) {
    return this.sectionsService.update(id, dto);
  }

  @Delete('venue-sections/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sectionsService.remove(id);
  }
}
